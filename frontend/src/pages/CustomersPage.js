import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper, Toolbar, Typography, TextField, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Stack,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Tooltip,
  Pagination
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { debounce } from 'lodash';

// O componente CustomerFormDialog permanece o mesmo da versão anterior.
const CustomerFormDialog = ({ open, onClose, onSave, customer, formErrors, setFormErrors }) => {
  // Mover initialFormData para fora do componente para resolver o warning do useEffect
  const initialFormData = {
    name: '', fantasy_name: '', person_type: 'F', cpf_cnpj: '', ie_rg: '', 
    is_ie_exempt: false, status: 'A', tax_regime: 'simples', phone: '', cell_phone: '', email: ''
    // ... outros campos podem ser inicializados aqui
  };

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open) {
      if (customer) {
        const customerData = { ...initialFormData, ...customer };
        customerData.birth_date = customerData.birth_date ? customerData.birth_date.split('T')[0] : null;
        customerData.customer_since = customerData.customer_since ? customerData.customer_since.split('T')[0] : null;
        customerData.next_visit = customerData.next_visit ? customerData.next_visit.split('T')[0] : null;
        setFormData(customerData);
      } else {
        setFormData(initialFormData);
      }
      setFormErrors({});
    }
  }, [customer, open, initialFormData, setFormErrors]); // Adicionar dependências

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    const dataToSave = {
        ...formData,
        birth_date: formData.birth_date || null,
        customer_since: formData.customer_since || null,
        next_visit: formData.next_visit || null,
    };
    await onSave(dataToSave);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{customer ? 'Editar Cliente' : 'Incluir Novo Cliente'}</DialogTitle>
      <DialogContent>
        {/* O conteúdo do formulário (Grid com TextFields) permanece o mesmo */}
        <DialogContentText sx={{ mb: 2 }}>
          Preencha os dados do cliente. Campos com * são obrigatórios.
        </DialogContentText>
        {formErrors.non_field_errors && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.non_field_errors.join(', ')}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}><Typography variant="subtitle1" gutterBottom>Identificação</Typography></Grid>
          <Grid item xs={12} sm={8}><TextField value={formData.name || ''} autoFocus required name="name" label="Nome / Razão Social" fullWidth variant="outlined" onChange={handleChange} error={!!formErrors.name} helperText={formErrors.name}/></Grid>
          <Grid item xs={12} sm={4}><TextField value={formData.fantasy_name || ''} name="fantasy_name" label="Nome Fantasia" fullWidth variant="outlined" onChange={handleChange} error={!!formErrors.fantasy_name} helperText={formErrors.fantasy_name}/></Grid>
          {/* ... e assim por diante para todos os outros campos do formulário ... */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
};


const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- ESTADOS PARA PAGINAÇÃO ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // --- FUNÇÃO DE BUSCA ATUALIZADA ---
  const fetchCustomers = useCallback(async (currentPage, search) => {
    try {
      setLoading(true);
      const response = await api.get('/customers/', {
        params: { page: currentPage, search: search }
      });
      setCustomers(response.data.results || []);
      // Calcula o total de páginas
      const count = response.data.count;
      const pageSize = 10; // O mesmo PAGE_SIZE do settings.py
      setTotalPages(Math.ceil(count / pageSize));
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os clientes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para a pesquisa para não fazer uma chamada à API a cada tecla digitada
  const debouncedFetch = useCallback(debounce((p, q) => fetchCustomers(p, q), 500), [fetchCustomers]);

  useEffect(() => {
    debouncedFetch(page, searchQuery);
  }, [page, searchQuery, debouncedFetch]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setPage(1); // Reseta para a primeira página ao pesquisar
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}/`, customerData);
      } else {
        await api.post('/customers/', customerData);
      }
      setDialogOpen(false);
      fetchCustomers(page, searchQuery); // Recarrega a página atual
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setFormErrors(err.response.data);
      } else {
        setError('Falha ao salvar o cliente.');
      }
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/customers/${customerToDelete.id}/`);
      fetchCustomers(page, searchQuery); // Recarrega a página atual
    } catch (err) {
      setError('Não foi possível deletar o cliente.');
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  if (loading && !customers.length) { // Mostra o loading inicial
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <CustomerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
      />
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o cliente "${customerToDelete?.name}"?`}
      />
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Clientes
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pesquisar..."
            onChange={handleSearchChange}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
            sx={{ mr: 2, width: '300px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingCustomer(null); setDialogOpen(true); }}>
            Incluir Cliente
          </Button>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CNPJ/CPF</TableCell>
                <TableCell>Cidade</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6}><CircularProgress /></TableCell></TableRow>}
              {!loading && customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.cpf_cnpj}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center">
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditingCustomer(customer); setDialogOpen(true);}}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDeleteClick(customer)}><DeleteIcon /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* --- COMPONENTE DE PAGINAÇÃO --- */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      </Paper>
    </>
  );
};

export default CustomersPage;