import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper, Toolbar, Typography, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../api';

const statusMap = {
  PENDING: { label: 'Pendente', color: 'warning' },
  COMPLETED: { label: 'Concluída', color: 'success' },
  CANCELED: { label: 'Cancelada', color: 'error' },
};

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const response = await api.get('/sales/');
        setSales(response.data.results || []);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar as vendas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Vendas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/sales/new')}>
          Nova Venda
        </Button>
      </Toolbar>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Valor Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow 
                key={sale.id} 
                hover 
                onClick={() => navigate(`/sales/${sale.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>#{sale.id}</TableCell>
                <TableCell>{sale.customer?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={statusMap[sale.status]?.label || sale.status} 
                    color={statusMap[sale.status]?.color || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default SalesPage;