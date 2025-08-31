import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper, Box, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Button, Divider, FormControl, Select, MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api';

const SaleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/sales/${id}/`);
        setSale(response.data);
        setError(null);
      } catch (err) {
        setError(`Não foi possível carregar os detalhes da venda #${id}.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    setIsUpdating(true);
    try {
      const response = await api.patch(`/sales/${id}/update-status/`, { status: newStatus });
      setSale(response.data); // Atualiza o estado local com os dados retornados pela API
    } catch (err) {
      setError('Falha ao atualizar o status da venda.');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!sale) {
    return <Alert severity="info">Venda não encontrada.</Alert>;
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Detalhes da Venda #{sale.id}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
        >
          Voltar
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" color="text.secondary">Cliente</Typography>
          <Typography variant="h6">{sale.customer?.name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} md={3}>
          <Typography variant="subtitle1" color="text.secondary">Data</Typography>
          <Typography variant="body1">{new Date(sale.created_at).toLocaleString('pt-BR')}</Typography>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <Select value={sale.status} onChange={handleStatusChange} disabled={isUpdating}>
              <MenuItem value={'PENDING'}>Pendente</MenuItem>
              <MenuItem value={'COMPLETED'}>Concluída</MenuItem>
              <MenuItem value={'CANCELED'}>Cancelada</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Itens da Venda</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell align="center">Quantidade</TableCell>
              <TableCell align="right">Preço Unitário</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product.name}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</TableCell>
                <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unit_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Typography variant="h5">
          Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_amount)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SaleDetailPage;