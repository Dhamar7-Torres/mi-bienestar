import api from './api';

export const alertService = {
  // Obtener todas las alertas
  getAll: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  // Marcar alerta como leída
  markAsRead: async (id) => {
    const response = await api.patch(`/alerts/${id}/read`);
    return response.data;
  },

  // Marcar múltiples alertas como leídas
  markMultipleAsRead: async (alertIds) => {
    const response = await api.patch('/alerts/read-multiple', { alertIds });
    return response.data;
  },

  // Obtener estadísticas de alertas
  getStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data;
  }
};