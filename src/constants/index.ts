// URLs de la API - Versión segura para evitar errores
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // En el navegador
    return import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api';
  }
  // En el servidor o durante build
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints específicos
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  
  // Estudiantes
  STUDENTS: {
    DASHBOARD: '/students/dashboard',
    EVALUATION_QUESTIONS: '/students/evaluation/questions',
    SUBMIT_EVALUATION: '/students/evaluation/submit',
    EVALUATION_HISTORY: '/students/evaluation/history',
    RESOURCES: '/students/resources',
    MARK_ALERT_READ: (alertaId: number) => `/students/alerts/${alertaId}/read`,
    PERSONAL_STATS: '/students/stats/personal'
  },
  
  // Coordinadores
  COORDINATORS: {
    DASHBOARD: '/coordinators/dashboard',
    STUDENTS_LIST: '/coordinators/students',
    STUDENT_DETAILS: (studentId: number) => `/coordinators/students/${studentId}`,
    ALERTS: '/coordinators/alerts',
    MARK_ALERTS_READ: '/coordinators/alerts/mark-read',
    ADVANCED_REPORT: '/coordinators/reports/advanced',
    GENERAL_STATS: '/coordinators/stats/overview',
    TRENDS: '/coordinators/stats/trends',
    CAREER_STATS: '/coordinators/stats/careers',
    EXPORT_STUDENTS: '/coordinators/export/students'
  },
  
  // Evaluaciones
  EVALUATIONS: {
    QUESTIONS: '/evaluations/questions',
    SUBMIT: '/evaluations/submit',
    HISTORY: '/evaluations/history',
    DETAILS: (evaluationId: number) => `/evaluations/${evaluationId}`
  }
} as const;

// Resto de constantes (sin cambios)
export const NIVELES_RIESGO = {
  BAJO: 'BAJO',
  MEDIO: 'MEDIO',
  ALTO: 'ALTO'
} as const;

export const COLORES_RIESGO = {
  BAJO: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'badge-success'
  },
  MEDIO: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'badge-warning'
  },
  ALTO: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'badge-error'
  }
} as const;

export const PAGINACION = {
  LIMITE_DEFAULT: 20,
  LIMITE_MIN: 5,
  LIMITE_MAX: 100,
  OPCIONES_LIMITE: [10, 20, 50, 100]
} as const;

export const EVALUACION = {
  ESCALA_MIN: 0,
  ESCALA_MAX: 4,
  LIMITE_SEMANAL: 2,
  TIEMPO_MINIMO_RESPUESTA: 30,
  TIEMPO_MAXIMO_RESPUESTA: 1800,
  ETIQUETAS_ESCALA: [
    { valor: 0, etiqueta: 'Nunca', descripcion: 'No he experimentado esto' },
    { valor: 1, etiqueta: 'Rara vez', descripcion: 'Muy ocasionalmente' },
    { valor: 2, etiqueta: 'A veces', descripcion: 'De vez en cuando' },
    { valor: 3, etiqueta: 'Frecuentemente', descripcion: 'Varias veces por semana' },
    { valor: 4, etiqueta: 'Siempre', descripcion: 'Constantemente o diariamente' }
  ]
} as const;

export const MENSAJES_ERROR = {
  NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Intenta de nuevo más tarde.',
  VALIDATION: 'Los datos proporcionados no son válidos.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
} as const;

export const MENSAJES_SUCCESS = {
  LOGIN: '¡Bienvenido! Has iniciado sesión exitosamente.',
  REGISTER: '¡Registro exitoso! Ya puedes usar la plataforma.',
  PROFILE_UPDATED: 'Perfil actualizado correctamente.',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente.',
  EVALUATION_SUBMITTED: 'Evaluación enviada correctamente.',
  ALERT_READ: 'Alerta marcada como leída.',
  DATA_SAVED: 'Datos guardados exitosamente.'
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'psychosocial_auth_token',
  USER_DATA: 'psychosocial_user_data',
  THEME: 'psychosocial_theme',
  LANGUAGE: 'psychosocial_language',
  DASHBOARD_PREFERENCES: 'psychosocial_dashboard_prefs'
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Estudiante
  STUDENT_DASHBOARD: '/estudiante/dashboard',
  STUDENT_EVALUATION: '/estudiante/evaluacion',
  STUDENT_RESOURCES: '/estudiante/recursos',
  STUDENT_HISTORY: '/estudiante/historial',
  STUDENT_PROFILE: '/estudiante/perfil',
  
  // Coordinador
  COORDINATOR_DASHBOARD: '/coordinador/dashboard',
  COORDINATOR_STUDENTS: '/coordinador/estudiantes',
  COORDINATOR_ALERTS: '/coordinador/alertas',
  COORDINATOR_REPORTS: '/coordinador/reportes',
  COORDINATOR_PROFILE: '/coordinador/perfil',
  
  // Otros
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401'
} as const;

// Configuración básica
export const CONFIG = {
  API_TIMEOUT: 10000,
  REFRESH_INTERVAL: 30000,
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000,
  MAX_EVALUATIONS_PER_WEEK: 2
} as const;

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  NIVELES_RIESGO,
  COLORES_RIESGO,
  PAGINACION,
  EVALUACION,
  MENSAJES_ERROR,
  MENSAJES_SUCCESS,
  STORAGE_KEYS,
  ROUTES,
  CONFIG
} as const;