import api from './api';

export const evaluationService = {
  // Obtener preguntas para evaluación
  getQuestions: async () => {
    const response = await api.get('/evaluations/questions');
    return response.data;
  },

  // Crear nueva evaluación
  create: async (evaluationData) => {
    const response = await api.post('/evaluations', evaluationData);
    return response.data;
  },

  // Obtener evaluaciones de un estudiante
  getByStudent: async (studentId, params = {}) => {
    const response = await api.get(`/evaluations/student/${studentId}`, { params });
    return response.data;
  },

  // Obtener última evaluación de un estudiante
  getLastByStudent: async (studentId) => {
    const response = await api.get(`/evaluations/student/${studentId}/last`);
    return response.data;
  }
};