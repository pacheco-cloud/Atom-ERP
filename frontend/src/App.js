import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import SaleFormPage from './pages/SaleFormPage';
// import SaleDetailPage from './pages/SaleDetailPage'; // Pode comentar ou remover esta linha
import SellersPage from './pages/SellersPage'; // 1. IMPORTE A NOVA PÁGINA
import SettingsPage from './pages/SettingsPage'; // Importe a nova página
import AccountReceivablePage from './pages/AccountReceivablePage'; // Importe a nova página
import AccountPayablePage from './pages/AccountPayablePage';     // Importe a nova página
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';


function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                background: { default: '#f4f6f8', paper: '#ffffff' }
              }
            : {
                background: { default: '#121212', paper: '#1e1e1e' },
              }),
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
              }
            }
          }
        }
      }),
    [mode],
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* As rotas abaixo agora estão protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout toggleTheme={toggleTheme} themeMode={mode} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/new" element={<SaleFormPage />} />
              <Route path="/sales/:id" element={<SaleFormPage />} /> {/* ALTERE ESTA LINHA */}
              <Route path="/sellers" element={<SellersPage />} /> {/* 2. ADICIONE A ROTA */}
              <Route path="/settings" element={<SettingsPage />} /> {/* Adicione a rota */}
              <Route path="/finance" element={<Navigate to="/finance/receivable" replace />} />
              <Route path="/finance/receivable" element={<AccountReceivablePage />} />
              <Route path="/finance/payable" element={<AccountPayablePage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
