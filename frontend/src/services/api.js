import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para requests (agregar autenticación, logs, etc.)
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses (manejo de errores, logs, etc.)
api.interceptors.response.use(
  (response) => {
    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    
    return response;
  },
  (error) => {
    // Log del error
    console.error('❌ API Error:', error);
    
    // Manejo de errores específicos
    if (error.response) {
      // El servidor respondió con un código de estado que indica error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message || 'Solicitud inválida');
          break;
        case 401:
          console.error('Unauthorized:', 'Token inválido o expirado');
          // Limpiar token y redirigir al login
          localStorage.removeItem('authToken');
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden:', 'No tienes permisos para esta acción');
          break;
        case 404:
          console.error('Not Found:', 'Recurso no encontrado');
          break;
        case 422:
          console.error('Validation Error:', data.errors || 'Errores de validación');
          break;
        case 500:
          console.error('Server Error:', 'Error interno del servidor');
          break;
        default:
          console.error(`HTTP Error ${status}:`, data.message || 'Error desconocido');
      }
      
      // Personalizar el mensaje de error
      const customError = {
        ...error,
        message: data.message || error.message,
        status,
        data
      };
      
      return Promise.reject(customError);
    } else if (error.request) {
      // La solicitud fue hecha pero no hubo respuesta
      console.error('Network Error:', 'Sin respuesta del servidor');
      const networkError = {
        ...error,
        message: 'Error de conexión. Verifica tu conexión a internet.',
        isNetworkError: true
      };
      return Promise.reject(networkError);
    } else {
      // Algo pasó al configurar la solicitud
      console.error('Request Setup Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Funciones helper para diferentes tipos de requests
export const apiHelpers = {
  // GET con manejo de parámetros
  get: (url, params = {}, config = {}) => {
    return api.get(url, { params, ...config });
  },

  // POST con data
  post: (url, data = {}, config = {}) => {
    return api.post(url, data, config);
  },

  // PUT con data
  put: (url, data = {}, config = {}) => {
    return api.put(url, data, config);
  },

  // PATCH con data
  patch: (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  },

  // DELETE
  delete: (url, config = {}) => {
    return api.delete(url, config);
  },

  // Upload de archivos
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  }
};

export default api;