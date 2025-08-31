import React, { useState, useEffect } from 'react';
import {
  Paper, Toolbar, Typography, TextField, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Stack,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Tooltip,
  FormControlLabel, Checkbox
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ProductFormDialog = ({ open, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      // Define o estado inicial para um novo produto, incluindo 'pays_commission'
      setFormData({ name: '', sku: '', description: '', sale_price: '', cost_price: '', stock_quantity: '', pays_commission: false });
    }
  }, [product, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.sale_price) {
      setFormError('Nome, SKU e Preço de Venda são obrigatórios.');
      return;
    }
    await onSave(formData);
    setFormError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{product ? 'Editar Produto' : 'Incluir Novo Produto'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
                <TextField value={formData.name || ''} autoFocus required name="name" label="Nome do Produto" fullWidth variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField value={formData.sku || ''} required name="sku" label="SKU" fullWidth variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
                <TextField value={formData.description || ''} name="description" label="Descrição" fullWidth multiline rows={3} variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField value={formData.sale_price || ''} required name="sale_price" label="Preço de Venda" type="number" fullWidth variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField value={formData.cost_price || ''} name="cost_price" label="Preço de Custo" type="number" fullWidth variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField value={formData.stock_quantity || ''} name="stock_quantity" label="Estoque" type="number" fullWidth variant="outlined" onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData.pays_commission || false}
                            onChange={handleChange} // Simplificado para usar o handler geral
                            name="pays_commission"
                        />
                    }
                    label="Este produto paga comissão"
                />
            </Grid>
        </Grid>
        {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/catalog/products/');
      setProducts(response.data.results || []);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os produtos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // CORRIGIDO: Adicionado '/catalog'
        await api.put(`/catalog/products/${editingProduct.id}/`, productData);
      } else {
        // CORRIGIDO: Adicionado '/catalog'
        await api.post('/catalog/products/', productData);
      }
      fetchProducts(); // Recarrega a lista após salvar
    } catch (err) {
      setError('Falha ao salvar o produto. Verifique os dados e tente novamente.');
      console.error(err);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // CORRIGIDO: Adicionado '/catalog'
      await api.delete(`/catalog/products/${productToDelete.id}/`);
      fetchProducts(); // Recarrega a lista após deletar
    } catch (err) {
      setError('Não foi possível deletar o produto. Verifique se ele não está associado a nenhuma venda.');
    } finally {
      setConfirmDialogOpen(false);
      setProductToDelete(null); // Limpa o estado
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery) ||
    p.sku.toLowerCase().includes(searchQuery)
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Produtos
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pesquisar por nome ou SKU..."
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mr: 2, width: '300px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
            setEditingProduct(null);
            setDialogOpen(true);
          }}>
            Incluir Produto
          </Button>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell align="right">Preço de Venda</TableCell>
                <TableCell align="center">Estoque</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sale_price)}</TableCell>
                  <TableCell align="center">{product.stock_quantity}</TableCell>
                  <TableCell align="center">                    
                    <Stack direction="row" justifyContent="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => {
                          setEditingProduct(product);
                          setDialogOpen(true);
                        }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(product)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default ProductsPage;
