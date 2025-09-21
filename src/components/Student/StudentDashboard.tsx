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
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Error al cargar</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Datos no disponibles</h2>
            <p className="text-gray-600 mb-6">No se pudieron cargar los datos del estudiante</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Perfil incompleto</h2>
            <p className="text-gray-600 mb-6">Faltan datos del estado actual del estudiante</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
      
      <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Encabezado de bienvenida */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              ¡Hola, {estudiante.nombreCompleto || 'Estudiante'}! 👋
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {estudiante.carrera || 'Carrera'} - {estudiante.semestre || 'N'}° Semestre
            </p>
          </div>

          {/* Alertas activas */}
          {alertasActivas && alertasActivas.length > 0 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Tienes {alertasActivas.length} alerta{alertasActivas.length > 1 ? 's' : ''} pendiente{alertasActivas.length > 1 ? 's' : ''}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 font-medium">
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
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Mi Estado Actual</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${riskColors.bg} ${riskColors.border} border-2 mb-3 shadow-lg`}>
                      <span className="text-2xl font-bold text-gray-800">
                        {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? '🚨' : 
                         estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Estado General</h3>
                    <p className={`text-sm font-bold ${riskColors.text}`}>
                      Riesgo {estudiante.estadoActual.estadoRiesgo || 'DESCONOCIDO'}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-300 mb-3 shadow-lg">
                      <span className="text-xl font-bold text-red-800">
                        {estudiante.estadoActual.nivelEstres || 0}/10
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Nivel de Estrés</h3>
                    <p className="text-sm text-gray-600 font-medium">Última evaluación</p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300 mb-3 shadow-lg">
                      <span className="text-xl font-bold text-orange-800">
                        {estudiante.estadoActual.nivelBurnout || 0}/10
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Nivel de Burnout</h3>
                    <p className="text-sm text-gray-600 font-medium">Agotamiento emocional</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="text-sm text-gray-600 font-medium">
                    <strong>Última evaluación:</strong> {formatearFecha(estudiante.estadoActual.fechaUltimaEvaluacion)}
                  </p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Mis Estadísticas</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.totalEvaluaciones}</div>
                    <div className="text-sm text-gray-600 font-medium">Evaluaciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.promedioEstres.toFixed(1)}</div>
                    <div className="text-sm text-gray-600 font-medium">Promedio Estrés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.promedioBurnout.toFixed(1)}</div>
                    <div className="text-sm text-gray-600 font-medium">Promedio Burnout</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      estadisticas.tendencia === 'mejorando' ? 'text-green-600' :
                      estadisticas.tendencia === 'empeorando' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {estadisticas.tendencia === 'mejorando' ? '📈' :
                       estadisticas.tendencia === 'empeorando' ? '📉' : '➖'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Tendencia</div>
                  </div>
                </div>
              </div>

              {/* Evaluaciones recientes */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Evaluaciones Recientes</h2>
                </div>
                
                {evaluacionesRecientes && evaluacionesRecientes.length > 0 ? (
                  <div className="space-y-3">
                    {evaluacionesRecientes.slice(0, 3).map((evaluacion) => (
                      <div key={evaluacion.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatearFecha(evaluacion.fechaEvaluacion)}
                          </p>
                          <p className="text-sm text-gray-600 font-medium">
                            Estrés: {evaluacion.puntajeEstres || 0}/10 • Burnout: {evaluacion.puntajeBurnout || 0}/10
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getRiskColor(evaluacion.nivelRiesgo).bg} ${getRiskColor(evaluacion.nivelRiesgo).text}`}>
                          {evaluacion.nivelRiesgo}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3">
                      <Link 
                        to={ROUTES.STUDENT_HISTORY}
                        className="text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 text-sm font-semibold transition-all duration-200"
                      >
                        Ver historial completo →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 font-medium">
                    No has realizado evaluaciones aún
                  </p>
                )}
              </div>
            </div>

            {/* Columna derecha - Acciones */}
            <div className="space-y-6">
              {/* Evaluación semanal */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Evaluación Semanal</h2>
                </div>
                
                {evaluacionSemanal.puedeEvaluar ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4 font-medium">
                        ¡Es hora de tu evaluación semanal! Toma unos minutos para evaluar cómo te has sentido.
                      </p>
                    </div>
                    <Link
                      to={ROUTES.STUDENT_EVALUATION}
                      className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-center"
                    >
                      Comenzar Evaluación
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2 font-medium">
                        {evaluacionSemanal.razon}
                      </p>
                      {evaluacionSemanal.proximaDisponible && (
                        <p className="text-sm text-gray-500 font-medium">
                          Próxima evaluación: {formatearFecha(evaluacionSemanal.proximaDisponible)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recursos */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Recursos de Ayuda</h2>
                </div>
                
                <div className="space-y-3">
                  <Link
                    to={ROUTES.STUDENT_RESOURCES}
                    className="block p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📚</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Recursos Educativos</h3>
                        <p className="text-sm text-gray-600 font-medium">Videos, técnicas y consejos</p>
                      </div>
                    </div>
                  </Link>

                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🆘</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">¿Necesitas ayuda inmediata?</h3>
                        <p className="text-sm text-gray-600 font-medium">Contacta a bienestar estudiantil</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Tip del día</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
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