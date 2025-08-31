import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('access_token');

  // Se não houver token, redireciona para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se houver token, renderiza o componente filho (Layout e suas rotas aninhadas)
  return <Outlet />;
};

export default ProtectedRoute;