import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, MENSAJES_ERROR } from '../constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - manejo de errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any) {
    if (error.response) {
      // Error de respuesta del servidor
      return {
        message: error.response.data?.message || MENSAJES_ERROR.SERVER_ERROR,
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Error de red
      return {
        message: MENSAJES_ERROR.NETWORK,
        status: 0
      };
    } else {
      // Error de configuración
      return {
        message: error.message || MENSAJES_ERROR.SERVER_ERROR,
        status: 0
      };
    }
  }

  // Métodos de autenticación
  async login(correo: string, contrasena: string) {
    const response = await this.api.post('/auth/login', { correo, contrasena });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(profileData: any) {
    const response = await this.api.put('/auth/profile', profileData);
    return response.data;
  }

  async changePassword(passwordData: any) {
    const response = await this.api.post('/auth/change-password', passwordData);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  // Métodos para estudiantes
  async getStudentDashboard() {
    const response = await this.api.get('/students/dashboard');
    return response.data;
  }

  async getEvaluationQuestions() {
    const response = await this.api.get('/students/evaluation/questions');
    return response.data;
  }

  async submitEvaluation(evaluationData: any) {
    const response = await this.api.post('/students/evaluation/submit', evaluationData);
    return response.data;
  }

  async getEvaluationHistory(params?: any) {
    const response = await this.api.get('/students/evaluation/history', { params });
    return response.data;
  }

  async getResources(params?: any) {
    const response = await this.api.get('/students/resources', { params });
    return response.data;
  }

  async markAlertAsRead(alertaId: number) {
    const response = await this.api.put(`/students/alerts/${alertaId}/read`);
    return response.data;
  }

  // Métodos para coordinadores
  async getCoordinatorDashboard() {
    const response = await this.api.get('/coordinators/dashboard');
    return response.data;
  }

  async getStudentsList(params?: any) {
    const response = await this.api.get('/coordinators/students', { params });
    return response.data;
  }

  async getStudentDetails(studentId: number) {
    const response = await this.api.get(`/coordinators/students/${studentId}`);
    return response.data;
  }

  async getAlerts(params?: any) {
    const response = await this.api.get('/coordinators/alerts', { params });
    return response.data;
  }

  async markAlertsAsRead(alertIds: number[]) {
    const response = await this.api.put('/coordinators/alerts/mark-read', { alertIds });
    return response.data;
  }

  async generateAdvancedReport(reportData?: any) {
    const response = await this.api.post('/coordinators/reports/advanced', reportData);
    return response.data;
  }

  async getGeneralStats() {
    const response = await this.api.get('/coordinators/stats/overview');
    return response.data;
  }

  async getTrends(weeks?: number) {
    const response = await this.api.get('/coordinators/stats/trends', { params: { weeks } });
    return response.data;
  }

  async getCareerStats() {
    const response = await this.api.get('/coordinators/stats/careers');
    return response.data;
  }
}

// Instancia singleton
export const apiService = new ApiService();
export default apiService;