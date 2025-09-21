import { ReactNode } from "react";

// Tipos de usuario
export interface Usuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  tipoUsuario: 'ESTUDIANTE' | 'COORDINADOR';
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipos específicos para estudiantes
export interface Estudiante {
  id: number;
  usuarioId: number;
  carrera: string;
  semestre: number;
  nivelEstresActual: number;
  nivelBurnoutActual: number;
  estadoRiesgo: NivelRiesgo;
  fechaUltimaEvaluacion?: string;
}

// Tipos específicos para coordinadores
export interface Coordinador {
  id: number;
  usuarioId: number;
  departamento: string;
}

// Tipos de evaluación
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type CategoriaEvaluacion = 'ESTRES' | 'BURNOUT';
export type TipoRecurso = 'VIDEO' | 'ARTICULO' | 'EJERCICIO' | 'TECNICA';

export interface PreguntaEvaluacion {
  id: number;
  texto: string;
  categoria: CategoriaEvaluacion;
  peso: number;
  orden?: number;
}

export interface Evaluacion {
  id: number;
  estudianteId: number;
  puntajeEstres: number;
  puntajeBurnout: number;
  puntajeTotal: number;
  nivelRiesgo: NivelRiesgo;
  respuestas: {
    estres: number[];
    burnout: number[];
    metadata?: any;
  };
  fechaEvaluacion: string;
}

// Tipos de alerta
export interface Alerta {
  id: number;
  estudianteId: number;
  tipoAlerta: string;
  severidad: NivelRiesgo;
  mensaje: string;
  estaLeida: boolean;
  fechaCreacion: string;
}

// Tipos de recursos
export interface Recurso {
  id: number;
  titulo: string;
  descripcion?: string;
  tipoRecurso: TipoRecurso;
  urlContenido?: string;
  categoria?: string;
  activo: boolean;
  fechaCreacion: string;
}

// Tipos para el contexto de autenticación
export interface AuthContextType {
  usuario: UsuarioCompleto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean; // <-- AGREGAR ESTA LÍNEA
  error: string | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (datos: DatosRegistro) => Promise<void>;
  logout: () => void;
  updateProfile: (datos: ActualizacionPerfil) => Promise<void>;
  clearError: () => void;
}

// Tipo completo de usuario con perfil específico
export interface UsuarioCompleto extends Usuario {
  estudiante?: Estudiante;
  coordinador?: Coordinador;
}

// Tipos para formularios
export interface DatosLogin {
  correo: string;
  contrasena: string;
}

export interface DatosRegistroBase {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  tipoUsuario: 'ESTUDIANTE' | 'COORDINADOR';
}

export interface DatosRegistroEstudiante extends DatosRegistroBase {
  tipoUsuario: 'ESTUDIANTE';
  carrera: string;
  semestre: number;
}

export interface DatosRegistroCoordinador extends DatosRegistroBase {
  tipoUsuario: 'COORDINADOR';
  departamento: string;
}

export type DatosRegistro = DatosRegistroEstudiante | DatosRegistroCoordinador;

export interface ActualizacionPerfil {
  nombreCompleto?: string;
  carrera?: string;
  semestre?: number;
  departamento?: string;
}

// Tipos para dashboard del estudiante
export interface DashboardEstudiante {
  estudiante: {
    id: number;
    nombreCompleto: string;
    correo: string;
    carrera: string;
    semestre: number;
    estadoActual: {
      nivelEstres: number;
      nivelBurnout: number;
      estadoRiesgo: NivelRiesgo;
      fechaUltimaEvaluacion?: string;
    };
  };
  evaluacionSemanal: {
    puedeEvaluar: boolean;
    razon?: string;
    proximaDisponible?: string;
  };
  estadisticas: EstadisticasEstudiante;
  evaluacionesRecientes: Evaluacion[];
  alertasActivas: Alerta[];
  progresoSemanal: ProgresoSemanal[];
}

// Tipos para estadísticas
export interface EstadisticasEstudiante {
  totalEvaluaciones: number;
  promedioEstres: number;
  promedioBurnout: number;
  tendencia: 'mejorando' | 'empeorando' | 'estable' | 'sin_datos';
}

export interface ProgresoSemanal {
  semana: string;
  evaluaciones: number;
  promedioEstres: number;
  promedioBurnout: number;
}

// Tipos para dashboard del coordinador
export interface DashboardCoordinador {
  resumenGeneral: EstadisticasGenerales;
  estudiantesRiesgoAlto: EstudianteResumen[];
  alertasRecientes: AlertaCompleta[];
  tendenciasSemanales: TendenciaSemanal[];
}

export interface EstadisticasGenerales {
  totalEstudiantes: number;
  distribucionRiesgo: {
    alto: number;
    medio: number;
    bajo: number;
  };
  alertasRiesgoAlto: number;
  tasaRespuestaSemanal: number;
  promedioEstres: number;
  promedioBurnout: number;
}

export interface EstudianteResumen {
  nivelBurnoutActual: ReactNode;
  nivelEstresActual: ReactNode;
  usuario: any;
  id: number;
  nombreCompleto: string;
  correo: string;
  carrera: string;
  semestre: number;
  estadoRiesgo: NivelRiesgo;
  nivelEstres: number;
  nivelBurnout: number;
  ultimaEvaluacion?: string;
  alertasActivas: number;
  alertasSeveridad: NivelRiesgo[];
}

export interface AlertaCompleta extends Alerta {
  tipo: ReactNode;
  estudiante: {
    usuario: any;
    id: number;
    nombre: string;
    carrera: string;
    estadoRiesgo: NivelRiesgo;
  };
  tiempoTranscurrido: string;
}

export interface TendenciaSemanal {
  semana: string;
  evaluaciones: number;
  promedioEstres: number;
  promedioBurnout: number;
}

// Tipos para respuestas de API
export interface RespuestaAPI<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ErrorValidacion[];
}

export interface ErrorValidacion {
  field: string;
  message: string;
  value?: any;
}

// Tipos para paginación
export interface PaginacionParams {
  pagina?: number;
  limite?: number;
}

export interface RespuestaPaginada<T> {
  items: T[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// Tipos para filtros
export interface FiltrosEstudiante {
  filtroRiesgo?: NivelRiesgo;
  filtroCarrera?: string;
  busqueda?: string;
  ordenarPor?: 'nombreCompleto' | 'carrera' | 'semestre' | 'estadoRiesgo' | 'fechaUltimaEvaluacion';
  orden?: 'asc' | 'desc';
}

export interface FiltrosAlerta {
  severidad?: NivelRiesgo;
  leidas?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}

// Tipos para análisis de evaluación
export interface AnalisisEvaluacion {
  summary: {
    es: string;
    priority: 'low' | 'moderate' | 'urgent';
  };
  patterns: PatronAnalisis[];
  trends: TendenciaAnalisis;
  riskFactors: string[];
  strengths: string[];
}

export interface PatronAnalisis {
  type: string;
  description: string;
  recommendation: string;
}

export interface TendenciaAnalisis {
  direction: 'improving' | 'worsening' | 'stable';
  note: string;
}

// Tipos para recomendaciones
export interface Recomendacion {
  category: string;
  title: string;
  description: string;
  priority: number;
}

// Tipos para reportes
export interface SolicitudReporte {
  fechaInicio?: string;
  fechaFin?: string;
  incluirDetalles?: boolean;
}

export interface ReporteAvanzado {
  periodo: {
    inicio: string;
    fin: string;
  };
  estadisticasGenerales: EstadisticasGenerales;
  tendenciasPeriodo: TendenciaSemanal[];
  distribucionCarrera: EstadisticaCarrera[];
  riesgoPorSemestre: RiesgoPorSemestre[];
  efectividadIntervenciones: any;
  fechaGeneracion: string;
}

export interface EstadisticaCarrera {
  carrera: string;
  totalEstudiantes: number;
  promedioEstres: number;
  promedioBurnout: number;
}

export interface RiesgoPorSemestre {
  semestre: number;
  estadoRiesgo: NivelRiesgo;
  count: number;
}

// Tipos para configuración
export interface ConfiguracionApp {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  enableAnalytics: boolean;
}

// Tipos para notificaciones
export interface Notificacion {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  autoClose?: boolean;
  duration?: number;
}

// Tipos para formulario de evaluación
export interface FormularioEvaluacion {
  respuestasEstres: number[];
  respuestasBurnout: number[];
  tiempoRespuesta?: number;
}

// Tipos para recursos educativos
export interface RecursosPorCategoria {
  [categoria: string]: Recurso[];
}

// Tipos para hooks personalizados
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>;
  reset: () => void;
  isValid: boolean;
  isSubmitting: boolean;
}

// Tipos para componentes
export interface ComponenteBaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface BotonProps extends ComponenteBaseProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface ModalProps extends ComponenteBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Tipos de eventos
export interface EventoSistema {
  tipo: string;
  usuario?: number;
  datos?: any;
  timestamp: string;
}