import api from './api';

export const resourceService = {
  // Obtener recursos con filtros
  getAll: async (params = {}) => {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  // Obtener recursos personalizados
  getPersonalized: async (studentId) => {
    const response = await api.get(`/resources/personalized/${studentId}`);
    return response.data;
  },

  // Crear nuevo recurso
  create: async (resourceData) => {
    const response = await api.post('/resources', resourceData);
    return response.data;
  }
};