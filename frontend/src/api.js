import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Interceptor de requisição para adicionar o token de acesso
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para lidar com a expiração do token
api.interceptors.response.use(
  // Se a resposta for bem-sucedida, não faz nada
  (response) => response,
  // Se a resposta for um erro
  async (error) => {
    const originalRequest = error.config;

    // Verifica se o erro é 401 (Não Autorizado) e se não é uma tentativa de renovar o token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca a requisição para evitar loops infinitos

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Tenta obter um novo token de acesso usando o refresh token
          const response = await axios.post('http://localhost:8000/api/v1/token/refresh/', { refresh: refreshToken });
          
          const { access } = response.data;

          // Armazena o novo token de acesso
          localStorage.setItem('access_token', access);

          // Atualiza o header da requisição original com o novo token
          originalRequest.headers['Authorization'] = `Bearer ${access}`;

          // Reenvia a requisição original
          return api(originalRequest);

        } catch (refreshError) {
          console.error('Refresh token failed', refreshError);
          // Se a renovação falhar, limpa o storage e redireciona para o login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.error('No refresh token found');
        // Se não houver refresh token, redireciona para o login
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Para outros erros, apenas rejeita a promise
    return Promise.reject(error);
  }
);

export default api;
