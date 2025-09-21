import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { ROUTES, COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { DashboardEstudiante } from '../../types';

function StudentDashboard() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardEstudiante | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state
        const response = await apiService.getStudentDashboard();
        
        if (response.success && response.data) {
          // Validar estructura de datos antes de asignar
          const data = response.data;
          if (data.estudiante && data.estadisticas && data.evaluacionSemanal) {
            setDashboardData(data);
          } else {
            setError('Datos del dashboard incompletos');
          }
        } else {
          setError(response.message || 'Error al cargar el dashboard');
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    // Solo cargar datos si hay usuario autenticado
    if (usuario) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
      setError('Usuario no autenticado');
    }
  }, [usuario]);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'Nunca';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getRiskColor = (nivel: string) => {
    return COLORES_RIESGO[nivel as keyof typeof COLORES_RIESGO] || COLORES_RIESGO.BAJO;
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando tu dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validar que dashboardData existe y tiene la estructura correcta
  if (!dashboardData || !dashboardData.estudiante) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos no disponibles</h2>
            <p className="text-gray-600 mb-4">No se pudieron cargar los datos del estudiante</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desestructurar con valores por defecto para evitar errores
  const {
    estudiante,
    evaluacionSemanal = { puedeEvaluar: false, razon: 'No disponible' },
    estadisticas = { totalEvaluaciones: 0, promedioEstres: 0, promedioBurnout: 0, tendencia: 'estable' },
    evaluacionesRecientes = [],
    alertasActivas = []
  } = dashboardData;

  // Validar que estudiante tiene la estructura correcta
  if (!estudiante.estadoActual) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil incompleto</h2>
            <p className="text-gray-600 mb-4">Faltan datos del estado actual del estudiante</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const riskColors = getRiskColor(estudiante.estadoActual.estadoRiesgo);

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Encabezado de bienvenida */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              ¡Hola, {estudiante.nombreCompleto || 'Estudiante'}! 👋
            </h1>
            <p className="mt-2 text-gray-600">
              {estudiante.carrera || 'Carrera'} - {estudiante.semestre || 'N'}° Semestre
            </p>
          </div>

          {/* Alertas activas */}
          {alertasActivas && alertasActivas.length > 0 && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Tienes {alertasActivas.length} alerta{alertasActivas.length > 1 ? 's' : ''} pendiente{alertasActivas.length > 1 ? 's' : ''}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      {alertasActivas.slice(0, 2).map((alerta, index) => (
                        <div key={alerta.id || index} className="mb-1">
                          - {alerta.mensaje || 'Alerta sin mensaje'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Estado actual */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado actual */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Mi Estado Actual</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${riskColors.bg} ${riskColors.border} border-2 mb-3`}>
                      <span className="text-2xl font-bold text-gray-800">
                        {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? '🚨' : 
                         estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Estado General</h3>
                    <p className={`text-sm font-semibold ${riskColors.text}`}>
                      Riesgo {estudiante.estadoActual.estadoRiesgo || 'DESCONOCIDO'}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-200 mb-3">
                      <span className="text-xl font-bold text-red-800">
                        {estudiante.estadoActual.nivelEstres || 0}/10
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Nivel de Estrés</h3>
                    <p className="text-sm text-gray-600">Última evaluación</p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-orange-100 border-2 border-orange-200 mb-3">
                      <span className="text-xl font-bold text-orange-800">
                        {estudiante.estadoActual.nivelBurnout || 0}/10
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Nivel de Burnout</h3>
                    <p className="text-sm text-gray-600">Agotamiento emocional</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Última evaluación:</strong> {formatearFecha(estudiante.estadoActual.fechaUltimaEvaluacion)}
                  </p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Mis Estadísticas</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.totalEvaluaciones}</div>
                    <div className="text-sm text-gray-600">Evaluaciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.promedioEstres.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Promedio Estrés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.promedioBurnout.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Promedio Burnout</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      estadisticas.tendencia === 'mejorando' ? 'text-green-600' :
                      estadisticas.tendencia === 'empeorando' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {estadisticas.tendencia === 'mejorando' ? '📈' :
                       estadisticas.tendencia === 'empeorando' ? '📉' : '➖'}
                    </div>
                    <div className="text-sm text-gray-600">Tendencia</div>
                  </div>
                </div>
              </div>

              {/* Evaluaciones recientes */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Evaluaciones Recientes</h2>
                </div>
                
                {evaluacionesRecientes && evaluacionesRecientes.length > 0 ? (
                  <div className="space-y-3">
                    {evaluacionesRecientes.slice(0, 3).map((evaluacion) => (
                      <div key={evaluacion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatearFecha(evaluacion.fechaEvaluacion)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Estrés: {evaluacion.puntajeEstres || 0}/10 • Burnout: {evaluacion.puntajeBurnout || 0}/10
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(evaluacion.nivelRiesgo).bg} ${getRiskColor(evaluacion.nivelRiesgo).text}`}>
                          {evaluacion.nivelRiesgo}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3">
                      <Link 
                        to={ROUTES.STUDENT_HISTORY}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Ver historial completo →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No has realizado evaluaciones aún
                  </p>
                )}
              </div>
            </div>

            {/* Columna derecha - Acciones */}
            <div className="space-y-6">
              {/* Evaluación semanal */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Evaluación Semanal</h2>
                </div>
                
                {evaluacionSemanal.puedeEvaluar ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">
                        ¡Es hora de tu evaluación semanal! Toma unos minutos para evaluar cómo te has sentido.
                      </p>
                    </div>
                    <Link
                      to={ROUTES.STUDENT_EVALUATION}
                      className="btn-primary w-full text-center block"
                    >
                      Comenzar Evaluación
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {evaluacionSemanal.razon}
                      </p>
                      {evaluacionSemanal.proximaDisponible && (
                        <p className="text-sm text-gray-500">
                          Próxima evaluación: {formatearFecha(evaluacionSemanal.proximaDisponible)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recursos */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Recursos de Ayuda</h2>
                </div>
                
                <div className="space-y-3">
                  <Link
                    to={ROUTES.STUDENT_RESOURCES}
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📚</span>
                      <div>
                        <h3 className="font-medium text-gray-900">Recursos Educativos</h3>
                        <p className="text-sm text-gray-600">Videos, técnicas y consejos</p>
                      </div>
                    </div>
                  </Link>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🆘</span>
                      <div>
                        <h3 className="font-medium text-gray-900">¿Necesitas ayuda inmediata?</h3>
                        <p className="text-sm text-gray-600">Contacta a bienestar estudiantil</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Tip del día</h3>
                <p className="text-sm text-gray-600">
                  Recuerda tomar descansos regulares durante tus estudios. La técnica Pomodoro (25 minutos de trabajo, 5 de descanso) puede ayudarte a mantener la concentración y reducir el estrés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;