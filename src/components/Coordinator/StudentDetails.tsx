import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ROUTES, COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';

interface StudentDetailsData {
  estudiante: {
    id: number;
    nombreCompleto: string;
    correo: string;
    carrera: string;
    semestre: number;
    estadoActual: {
      nivelEstres: number;
      nivelBurnout: number;
      estadoRiesgo: string;
      ultimaEvaluacion?: string;
    };
    fechaRegistro: string;
  };
  evaluaciones: any[];
  alertas: any[];
  estadisticas: any;
  analisisTendencia: any;
}

function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'general' | 'evaluaciones' | 'alertas'>('general');

  useEffect(() => {
    if (!studentId) {
      navigate(ROUTES.COORDINATOR_STUDENTS);
      return;
    }

    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getStudentDetails(parseInt(studentId!));
      
      if (response.success) {
        setStudentData(response.data);
      } else {
        setError(response.message || 'Error al cargar los detalles del estudiante');
      }
    } catch (error: any) {
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (nivel: string) => {
    return COLORES_RIESGO[nivel as keyof typeof COLORES_RIESGO] || COLORES_RIESGO.BAJO;
  };

  // FUNCIÓN FALTANTE - getSeverityColor (CORREGIDA)
  const getSeverityColor = (severidad: string) => {
    return COLORES_RIESGO[severidad as keyof typeof COLORES_RIESGO] || COLORES_RIESGO.BAJO;
  };

  const getTendenciaIcon = (direccion: string) => {
    switch (direccion) {
      case 'mejorando': return '📈 Mejorando';
      case 'empeorando': return '📉 Empeorando';
      case 'estable': return '➖ Estable';
      default: return '❓ Sin datos suficientes';
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando detalles del estudiante..." />
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
            <div className="space-x-4">
              <button 
                onClick={() => navigate(ROUTES.COORDINATOR_STUDENTS)}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Volver a la lista
              </button>
              <button 
                onClick={fetchStudentDetails}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) return null;

  const { estudiante, evaluaciones, alertas, estadisticas, analisisTendencia } = studentData;
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
          {/* Header con navegación */}
          <div className="mb-8">
            <button
              onClick={() => navigate(ROUTES.COORDINATOR_STUDENTS)}
              className="text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 text-sm font-semibold mb-4 transition-all duration-200"
            >
              ← Volver a la lista de estudiantes
            </button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              {estudiante.nombreCompleto}
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {estudiante.carrera} - {estudiante.semestre}° Semestre
            </p>
          </div>

          {/* Información general del estudiante */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">Estado Actual</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${riskColors.bg} border-2 mb-3 shadow-lg`}>
                      <span className="text-2xl">
                        {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? '🚨' : 
                         estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Estado General</h3>
                    <p className={`text-sm font-bold ${riskColors.text}`}>
                      Riesgo {estudiante.estadoActual.estadoRiesgo}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-300 mb-3 shadow-lg">
                      <span className="text-xl font-bold text-red-800">
                        {estudiante.estadoActual.nivelEstres}/10
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Nivel de Estrés</h3>
                    <p className="text-sm text-gray-600 font-medium">Última evaluación</p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300 mb-3 shadow-lg">
                      <span className="text-xl font-bold text-orange-800">
                        {estudiante.estadoActual.nivelBurnout}/10
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Nivel de Burnout</h3>
                    <p className="text-sm text-gray-600 font-medium">Agotamiento emocional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/30">
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Última evaluación:</span>
                    <p className="font-semibold text-gray-900">{formatearFecha(estudiante.estadoActual.ultimaEvaluacion)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Registrado desde:</span>
                    <p className="font-semibold text-gray-900">{formatearFecha(estudiante.fechaRegistro)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">Estadísticas</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Total evaluaciones:</span>
                    <span className="font-bold text-gray-900">{estadisticas?.totalEvaluaciones || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Frecuencia:</span>
                    <span className="font-bold text-gray-900">{estadisticas?.frecuenciaEvaluacion || 0} por semana</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Tendencia:</span>
                    <span className="font-bold text-gray-900">{getTendenciaIcon(analisisTendencia?.direccion)}</span>
                  </div>
                </div>
              </div>

              {/* Alertas activas */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">Alertas Recientes</h2>
                {alertas.length > 0 ? (
                  <div className="space-y-2">
                    {alertas.slice(0, 3).map((alerta) => (
                      <div key={alerta.id} className={`p-3 rounded-xl ${getSeverityColor(alerta.severidad).bg} shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{alerta.tipoAlerta}</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatearFecha(alerta.fechaCreacion)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{alerta.mensaje}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm font-medium">No hay alertas recientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs para diferentes vistas */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="border-b border-white/30 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setVistaActual('general')}
                  className={`py-2 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                    vistaActual === 'general'
                      ? 'border-cyan-500 text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Vista General
                </button>
                <button
                  onClick={() => setVistaActual('evaluaciones')}
                  className={`py-2 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                    vistaActual === 'evaluaciones'
                      ? 'border-cyan-500 text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Evaluaciones ({evaluaciones.length})
                </button>
                <button
                  onClick={() => setVistaActual('alertas')}
                  className={`py-2 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                    vistaActual === 'alertas'
                      ? 'border-cyan-500 text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Alertas ({alertas.length})
                </button>
              </nav>
            </div>

            {/* Contenido según la vista seleccionada */}
            {vistaActual === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Información de Contacto</h3>
                  <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Correo:</span>
                        <p className="font-semibold text-gray-900">{estudiante.correo}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Carrera:</span>
                        <p className="font-semibold text-gray-900">{estudiante.carrera}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recomendaciones de Intervención</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                    {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? (
                      <ul className="text-blue-800 space-y-1 font-medium">
                        <li>• Contactar inmediatamente para ofrecer apoyo</li>
                        <li>• Referir a servicios de salud mental</li>
                        <li>• Programar seguimiento semanal</li>
                        <li>• Considerar ajustes académicos temporales</li>
                      </ul>
                    ) : estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? (
                      <ul className="text-blue-800 space-y-1 font-medium">
                        <li>• Ofrecer recursos de manejo del estrés</li>
                        <li>• Programar check-in en 2 semanas</li>
                        <li>• Monitorear evaluaciones futuras</li>
                      </ul>
                    ) : (
                      <ul className="text-blue-800 space-y-1 font-medium">
                        <li>• Mantener monitoreo regular</li>
                        <li>• Reforzar hábitos saludables actuales</li>
                        <li>• Evaluación mensual estándar</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {vistaActual === 'evaluaciones' && (
              <div className="space-y-4">
                {evaluaciones.length > 0 ? (
                  evaluaciones.map((evaluacion) => (
                    <div key={evaluacion.id} className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {formatearFecha(evaluacion.fechaEvaluacion)}
                        </h4>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskColor(evaluacion.nivelRiesgo).bg} ${getRiskColor(evaluacion.nivelRiesgo).text} shadow-sm`}>
                          {evaluacion.nivelRiesgo}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-red-600">{evaluacion.puntajeEstres}/10</div>
                          <div className="text-xs text-gray-500 font-medium">Estrés</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{evaluacion.puntajeBurnout}/10</div>
                          <div className="text-xs text-gray-500 font-medium">Burnout</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{evaluacion.puntajeTotal}/10</div>
                          <div className="text-xs text-gray-500 font-medium">Total</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 font-medium">No hay evaluaciones registradas</p>
                )}
              </div>
            )}

            {vistaActual === 'alertas' && (
              <div className="space-y-4">
                {alertas.length > 0 ? (
                  alertas.map((alerta) => (
                    <div key={alerta.id} className={`border-l-4 p-4 rounded-xl ${getSeverityColor(alerta.severidad).bg} shadow-sm hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{alerta.tipoAlerta}</h4>
                        <span className="text-sm text-gray-500 font-medium">
                          {formatearFecha(alerta.fechaCreacion)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{alerta.mensaje}</p>
                      {!alerta.estaLeida && (
                        <span className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                          Sin leer
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 font-medium">No hay alertas registradas</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;