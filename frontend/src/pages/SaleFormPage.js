import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Box, Typography, Grid, Autocomplete, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Alert, CircularProgress, Divider, Checkbox, FormControlLabel, Tooltip, MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import api from '../api';

const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
};

const SaleFormPage = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // States
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [settings, setSettings] = useState(null); // Iniciar como null para sabermos quando está carregado
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [exitDate, setExitDate] = useState('');
    const [paymentCondition, setPaymentCondition] = useState('');
    const [category, setCategory] = useState('SERVICE');
    const [installments, setInstallments] = useState([]);
    const [applyTax, setApplyTax] = useState(true);
    const [status, setStatus] = useState('PENDING');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [customersRes, productsRes, sellersRes, settingsRes] = await Promise.all([
                    api.get('/customers/'),
                    api.get('/catalog/products/'),
                    api.get('/sellers/'),
                    api.get('/configuration/settings/'),
                ]);
                setCustomers(customersRes.data.results || []);
                setProducts(productsRes.data.results || []);
                setSellers(sellersRes.data.results || []);
                setSettings(settingsRes.data || { tax_rate: 0 }); // Garante que settings nunca é undefined

                if (isEditMode) {
                    const saleRes = await api.get(`/sales/${id}/`);
                    const saleData = saleRes.data;

                    setEntryDate(saleData.entry_date || '');
                    setExitDate(saleData.exit_date || '');
                    setPaymentCondition(saleData.payment_condition || '');
                    setCategory(saleData.category || 'SERVICE');
                    setStatus(saleData.status || 'PENDING');
                    setSelectedCustomer(saleData.customer);
                    setSelectedSeller(saleData.seller);
                    setApplyTax(parseFloat(saleData.tax_rate) > 0);
                    setInstallments(saleData.installments || []);

                    const items = saleData.items.map(item => ({
                        ...item,
                        unit_price: parseFloat(item.unit_price),
                    }));
                    setSaleItems(items);
                }
            } catch (err) {
                setError('Falha ao carregar dados. Verifique se todas as migrações do backend foram executadas.');
                console.error(err);
                setSettings({ tax_rate: 0 }); // Define um fallback em caso de erro
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id, isEditMode]);

    const totalAmount = useMemo(() => saleItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0), [saleItems]);

    const totalCommission = useMemo(() => {
        return saleItems
            .filter(item => item.pays_commission)
            .reduce((total, item) => {
                const itemCommissionRate = item.product?.commission_rate ?? 0;
                const itemTotal = item.quantity * item.unit_price;
                return total + (itemTotal * (itemCommissionRate / 100));
            }, 0);
    }, [saleItems]);

    const taxAmount = useMemo(() => {
        if (!applyTax) return 0;
        // ALTERAÇÃO: Usar optional chaining (?.) para aceder de forma segura
        const taxRate = settings?.tax_rate ?? 0;
        return totalAmount * (parseFloat(taxRate) / 100);
    }, [applyTax, totalAmount, settings]);

    const grandTotal = useMemo(() => totalAmount + taxAmount, [totalAmount, taxAmount]);

    const handleGenerateInstallments = () => {
        if (!paymentCondition || !exitDate || totalAmount <= 0) {
            setError("Preencha a Data de Saída, Condições de Pagamento e adicione itens para gerar parcelas.");
            return;
        }
        setError('');

        const days = paymentCondition.split('/').map(day => parseInt(day.trim(), 10));
        if (days.some(isNaN)) {
            setError("Condição de pagamento inválida. Use números separados por '/'. Ex: 15 ou 15/30/45");
            return;
        }

        const numInstallments = days.length;
        const amountPerInstallment = parseFloat((totalAmount / numInstallments).toFixed(2));

        const newInstallments = days.map((day, index) => ({
            installment_number: index + 1,
            amount: amountPerInstallment,
            due_date: addDays(exitDate, day),
        }));

        const totalCalculated = newInstallments.reduce((sum, inst) => sum + inst.amount, 0);
        const difference = parseFloat((totalAmount - totalCalculated).toFixed(2));
        if (difference !== 0) {
            newInstallments[newInstallments.length - 1].amount += difference;
        }

        setInstallments(newInstallments);
    };

    const handleAddItem = (product, quantity = 1) => {
        if (!product) return;
        setSaleItems(prevItems => {
            const existingItem = prevItems.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevItems, {
                    product: product,
                    quantity: quantity,
                    unit_price: parseFloat(product.price),
                    pays_commission: product.pays_commission
                }];
            }
        });
    };

    const handlePriceChange = (productId, newPrice) => {
        setSaleItems(saleItems.map(item =>
            item.product.id === productId ? { ...item, unit_price: newPrice } : item
        ));
    };

    const handleCommissionChange = (productId, checked) => {
        setSaleItems(saleItems.map(item =>
            item.product.id === productId ? { ...item, pays_commission: checked } : item
        ));
    };

    const handleRemoveItem = (productId) => {
        setSaleItems(saleItems.filter(item => item.product.id !== productId));
    };

    const handleSaveSale = async () => {
        if (!selectedSeller || !selectedCustomer || saleItems.length === 0) {
            setError('Vendedor, Cliente e pelo menos um item são obrigatórios.');
            return;
        }

        const payload = {
            customer_id: selectedCustomer.id,
            seller_id: selectedSeller.id,
            status,
            entry_date: entryDate,
            exit_date: exitDate,
            payment_condition: paymentCondition,
            category,
            apply_tax: applyTax,
            items: saleItems.map(item => ({
                product: item.product.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                pays_commission: item.pays_commission,
            })),
            installments: installments.map(inst => ({
                ...inst,
                amount: inst.amount.toFixed(2)
            })),
        };

        setSaving(true);
        setError('');
        try {
            if (isEditMode) {
                await api.put(`/sales/${id}/`, payload);
            } else {
                await api.post('/sales/', payload);
            }
            navigate('/sales');
        } catch (err) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            setError('Ocorreu um erro ao salvar a venda: ' + errorMsg);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Adicionado !settings à condição de loading
    if (loading || !settings) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>{isEditMode ? `Editar Ordem de Serviço #${id}` : 'Nova Ordem de Serviço'}</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><Autocomplete options={sellers} getOptionLabel={(option) => option.name || ''} value={selectedSeller} isOptionEqualToValue={(option, value) => option.id === value.id} onChange={(event, newValue) => setSelectedSeller(newValue)} renderInput={(params) => <TextField {...params} label="* Selecione o Vendedor" />} /></Grid>
                <Grid item xs={12} sm={6}><Autocomplete options={customers} getOptionLabel={(option) => option.name || ''} value={selectedCustomer} isOptionEqualToValue={(option, value) => option.id === value.id} onChange={(event, newValue) => setSelectedCustomer(newValue)} renderInput={(params) => <TextField {...params} label="* Selecione o Cliente" />} /></Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="overline">Detalhes da Ordem de Serviço</Typography></Divider></Grid>

                <Grid item xs={12} sm={3}><TextField label="Data de Entrada" type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} sm={3}><TextField label="Data de Saída" type="date" value={exitDate} onChange={e => setExitDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} sm={3}><TextField select label="Categoria" value={category} onChange={e => setCategory(e.target.value)} fullWidth><MenuItem value="SERVICE">Serviços</MenuItem></TextField></Grid>
                <Grid item xs={12} sm={3}><TextField label="Condições de Pagamento" value={paymentCondition} onChange={e => setPaymentCondition(e.target.value)} fullWidth placeholder="Ex: 15 ou 15/30" InputProps={{ endAdornment: (<Tooltip title="Gerar Parcelas"><IconButton onClick={handleGenerateInstallments} edge="end"><PlayArrowIcon /></IconButton></Tooltip>), }}/></Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="overline">Itens</Typography></Divider></Grid>

                <ProductQuickAdd products={products} onAddItem={handleAddItem} />

                <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Produto/Serviço</TableCell>
                                    <TableCell align="center">Qtd.</TableCell>
                                    <TableCell align="right">Preço Unit.</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                    <TableCell align="center">Comissão?</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {saleItems.map((item) => (
                                    <TableRow key={item.product.id}>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell align="center">{item.quantity}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => handlePriceChange(item.product.id, parseFloat(e.target.value || 0))}
                                                sx={{ width: 100 }}
                                                size="small"
                                                inputProps={{ step: "0.01" }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <Checkbox
                                                checked={item.pays_commission}
                                                onChange={(e) => handleCommissionChange(item.product.id, e.target.checked)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleRemoveItem(item.product.id)} size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {installments.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="h6">Parcelas</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Parcela</TableCell>
                                        <TableCell align="center">Vencimento</TableCell>
                                        <TableCell align="right">Valor</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {installments.map((inst) => (
                                        <TableRow key={inst.installment_number}>
                                            <TableCell>{inst.installment_number}</TableCell>
                                            <TableCell align="center">{new Date(inst.due_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Grid container justifyContent="flex-end" spacing={2}>
                        <Grid item xs={12} md={5}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1">Resumo Financeiro</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Grid container>
                                    <Grid item xs={6}><Typography>Subtotal:</Typography></Grid>
                                    <Grid item xs={6}><Typography align="right">{totalAmount.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}><Typography>Comissão Vendedor:</Typography></Grid>
                                    <Grid item xs={6}><Typography align="right">{totalCommission.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}>
                                        <FormControlLabel
                                            control={<Checkbox checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />}
                                            label={`Imposto (${settings?.tax_rate ?? 0}%):`}
                                        />
                                    </Grid>
                                    <Grid item xs={6}><Typography align="right">{taxAmount.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                                    <Grid item xs={6}><Typography variant="h6">Total:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="h6" align="right">{grandTotal.toFixed(2)}</Typography></Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" color="secondary" onClick={() => navigate('/sales')}>Cancelar</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveSale}
                            disabled={saving}
                        >
                            {saving ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

const ProductQuickAdd = ({ products, onAddItem }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
        if (selectedProduct) {
            onAddItem(selectedProduct, quantity);
            setSelectedProduct(null);
            setQuantity(1);
        }
    };

    return (
        <>
            <Grid item xs={12} sm={7}>
                <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.name} (R$ ${option.sale_price})`}
                    value={selectedProduct}
                    onChange={(event, newValue) => setSelectedProduct(newValue)}
                    renderInput={(params) => <TextField {...params} label="Adicionar Produto/Serviço" />}
                />
            </Grid>
            <Grid item xs={6} sm={3}>
                <TextField
                    label="Quantidade"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    fullWidth
                    inputProps={{ min: 1 }}
                />
            </Grid>
            <Grid item xs={6} sm={2}>
                <Button onClick={handleAdd} variant="contained" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>
        </>
    );
};

export default SaleFormPage;