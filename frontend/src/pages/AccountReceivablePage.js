import React, { useState, useEffect } from 'react';
import {
  Paper, Toolbar, Typography, TextField, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Stack,
  Pagination // Adicionado Pagination
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '../api';

const AccountReceivablePage = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalCount, setTotalCount] = useState(0);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/finance/receivables/?page=${page}&page_size=${pageSize}&search=${searchQuery}`);
      setReceivables(response.data.results || []);
      setTotalCount(response.data.count);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar as contas a receber.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [page, pageSize, searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Contas a Receber
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pesquisar..."
            onChange={handleSearchChange}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ mr: 2, width: '300px' }}
          />
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Descrição</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>OS</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Vencimento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Pagamento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivables.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{item.sale_id}</TableCell>
                  <TableCell align="right">{parseFloat(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>{item.due_date}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.payment_date || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(totalCount / pageSize)}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </>
  );
};

export default AccountReceivablePage;