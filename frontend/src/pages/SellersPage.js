import React, { useState, useEffect } from 'react';
import {
  Paper, Toolbar, Typography, TextField, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Stack,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Tooltip
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api';
import ConfirmationDialog from '../components/ConfirmationDialog';

// Componente do formulário em diálogo
const SellerFormDialog = ({ open, onClose, onSave, seller }) => {
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (seller) {
      setFormData({
        username: seller.user.username,
        first_name: seller.user.first_name,
        last_name: seller.user.last_name,
        email: seller.user.email,
        phone: seller.phone,
        commission_rate: seller.commission_rate,
      });
    } else {
      setFormData({ username: '', first_name: '', last_name: '', email: '', phone: '', commission_rate: '' });
    }
  }, [seller, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.username || !formData.first_name || !formData.email) {
      setFormError('Usuário, Nome e E-mail são obrigatórios.');
      return;
    }
    await onSave(formData);
    setFormError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{seller ? 'Editar Vendedor' : 'Incluir Novo Vendedor'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField value={formData.first_name || ''} autoFocus required name="first_name" label="Nome" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField value={formData.last_name || ''} name="last_name" label="Sobrenome" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField value={formData.username || ''} required name="username" label="Nome de Usuário" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField value={formData.email || ''} required name="email" label="E-mail" type="email" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField value={formData.phone || ''} name="phone" label="Telefone" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField value={formData.commission_rate || ''} name="commission_rate" label="Comissão (%)" type="number" fullWidth variant="outlined" onChange={handleChange} />
          </Grid>
           {!seller && (
            <Grid item xs={12}>
              <TextField name="password" label="Senha" type="password" fullWidth variant="outlined" onChange={handleChange} helperText="A senha padrão é '123456' se deixado em branco." />
            </Grid>
          )}
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

// Componente principal da página
const SellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sellers/');
      setSellers(response.data.results || []);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os vendedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleSaveSeller = async (sellerData) => {
    try {
      if (editingSeller) {
        await api.patch(`/sellers/${editingSeller.id}/`, sellerData);
      } else {
        await api.post('/sellers/', sellerData);
      }
      fetchSellers();
    } catch (err) {
      setError('Falha ao salvar o vendedor.');
    }
  };

  const handleDeleteClick = (seller) => {
    setSellerToDelete(seller);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/sellers/${sellerToDelete.id}/`);
      fetchSellers();
    } catch (err) {
      setError('Não foi possível deletar o vendedor.');
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  const filteredSellers = sellers.filter(s =>
    (s.user.first_name.toLowerCase() + ' ' + s.user.last_name.toLowerCase()).includes(searchQuery) ||
    s.user.username.toLowerCase().includes(searchQuery) ||
    s.user.email.toLowerCase().includes(searchQuery)
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <SellerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSeller}
        seller={editingSeller}
      />
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o vendedor "${sellerToDelete?.user.first_name}"?`}
      />
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vendedores
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pesquisar..."
            onChange={handleSearchChange}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ mr: 2, width: '300px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingSeller(null); setDialogOpen(true); }}>
            Incluir Vendedor
          </Button>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="right">Comissão (%)</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSellers.map((seller) => (
                <TableRow key={seller.id} hover>
                  <TableCell>{`${seller.user.first_name} ${seller.user.last_name}`}</TableCell>
                  <TableCell>{seller.user.username}</TableCell>
                  <TableCell>{seller.user.email}</TableCell>
                  <TableCell>{seller.phone}</TableCell>
                  <TableCell align="right">{seller.commission_rate}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => { setEditingSeller(seller); setDialogOpen(true); }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(seller)}>
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

export default SellersPage;
