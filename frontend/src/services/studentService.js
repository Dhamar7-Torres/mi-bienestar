import api from './api';

export const studentService = {
  // Obtener todos los estudiantes
  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },

  // Obtener estudiante por ID
  getById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Crear nuevo estudiante
  create: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  // Obtener estadísticas generales
  getStats: async () => {
    const response = await api.get('/students/stats');
    return response.data;
  }
};