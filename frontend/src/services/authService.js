import api from './api';

export const authService = {
  // Registrar nuevo usuario
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Iniciar sesión
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Verificar token
  verifyToken: async (token) => {
    const response = await api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cerrar sesión
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};