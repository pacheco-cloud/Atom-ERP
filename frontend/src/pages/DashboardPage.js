import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { People as PeopleIcon, Inventory2 as InventoryIcon, PointOfSale as PointOfSaleIcon } from '@mui/icons-material';
import api from '../api';

const StatCard = ({ icon, title, value }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
    {icon}
    <Box sx={{ ml: 2 }}>
      <Typography variant="h6">{value}</Typography>
      <Typography color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const statusMap = {
  PENDING: { label: 'Pendente', color: 'warning' },
  COMPLETED: { label: 'Concluída', color: 'success' },
  CANCELED: { label: 'Cancelada', color: 'error' },
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // A URL foi corrigida para apontar para a rota dentro da app 'sales'
        const response = await api.get('/sales/dashboard-stats/');
        setStats(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Grid container spacing={3}>
      {/* Cards de Estatísticas */}
      <Grid item xs={12} sm={4}>
        <StatCard icon={<PointOfSaleIcon sx={{ fontSize: 40, color: 'primary.main' }} />} title="Vendas" value={stats.sale_count} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard icon={<PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />} title="Clientes" value={stats.customer_count} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard icon={<InventoryIcon sx={{ fontSize: 40, color: 'warning.main' }} />} title="Produtos" value={stats.product_count} />
      </Grid>

      {/* Tabela de Vendas Recentes */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Vendas Recentes</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>OS Nº</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recent_sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>#{sale.id}</TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={statusMap[sale.status]?.label || sale.status} 
                        color={statusMap[sale.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
