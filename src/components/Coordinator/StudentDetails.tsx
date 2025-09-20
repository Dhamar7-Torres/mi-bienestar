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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => navigate(ROUTES.COORDINATOR_STUDENTS)}
              className="btn-primary mr-4"
            >
              Volver a la lista
            </button>
            <button 
              onClick={fetchStudentDetails}
              className="btn-secondary"
            >
              Reintentar
            </button>
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
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header con navegación */}
          <div className="mb-8">
            <button
              onClick={() => navigate(ROUTES.COORDINATOR_STUDENTS)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
            >
              ← Volver a la lista de estudiantes
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">
              {estudiante.nombreCompleto}
            </h1>
            <p className="mt-2 text-gray-600">
              {estudiante.carrera} - {estudiante.semestre}° Semestre
            </p>
          </div>

          {/* Información general del estudiante */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado Actual</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${riskColors.bg} border-2 mb-3`}>
                      <span className="text-2xl">
                        {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? '🚨' : 
                         estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Estado General</h3>
                    <p className={`text-sm font-semibold ${riskColors.text}`}>
                      Riesgo {estudiante.estadoActual.estadoRiesgo}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-200 mb-3">
                      <span className="text-xl font-bold text-red-800">
                        {estudiante.estadoActual.nivelEstres}/10
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Nivel de Estrés</h3>
                    <p className="text-sm text-gray-600">Última evaluación</p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-orange-100 border-2 border-orange-200 mb-3">
                      <span className="text-xl font-bold text-orange-800">
                        {estudiante.estadoActual.nivelBurnout}/10
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Nivel de Burnout</h3>
                    <p className="text-sm text-gray-600">Agotamiento emocional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-sm text-gray-600">Última evaluación:</span>
                    <p className="font-medium">{formatearFecha(estudiante.estadoActual.ultimaEvaluacion)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Registrado desde:</span>
                    <p className="font-medium">{formatearFecha(estudiante.fechaRegistro)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total evaluaciones:</span>
                    <span className="font-medium">{estadisticas?.totalEvaluaciones || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frecuencia:</span>
                    <span className="font-medium">{estadisticas?.frecuenciaEvaluacion || 0} por semana</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tendencia:</span>
                    <span className="font-medium">{getTendenciaIcon(analisisTendencia?.direccion)}</span>
                  </div>
                </div>
              </div>

              {/* Alertas activas */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Recientes</h2>
                {alertas.length > 0 ? (
                  <div className="space-y-2">
                    {alertas.slice(0, 3).map((alerta) => (
                      <div key={alerta.id} className={`p-3 rounded-lg ${getSeverityColor(alerta.severidad).bg}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{alerta.tipoAlerta}</span>
                          <span className="text-xs text-gray-500">
                            {formatearFecha(alerta.fechaCreacion)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alerta.mensaje}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay alertas recientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs para diferentes vistas */}
          <div className="card">
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setVistaActual('general')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    vistaActual === 'general'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Vista General
                </button>
                <button
                  onClick={() => setVistaActual('evaluaciones')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    vistaActual === 'evaluaciones'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Evaluaciones ({evaluaciones.length})
                </button>
                <button
                  onClick={() => setVistaActual('alertas')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    vistaActual === 'alertas'
                      ? 'border-blue-500 text-blue-600'
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
                  <h3 className="font-medium text-gray-900 mb-3">Información de Contacto</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Correo:</span>
                        <p className="font-medium">{estudiante.correo}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Carrera:</span>
                        <p className="font-medium">{estudiante.carrera}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Recomendaciones de Intervención</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {estudiante.estadoActual.estadoRiesgo === 'ALTO' ? (
                      <ul className="text-blue-800 space-y-1">
                        <li>• Contactar inmediatamente para ofrecer apoyo</li>
                        <li>• Referir a servicios de salud mental</li>
                        <li>• Programar seguimiento semanal</li>
                        <li>• Considerar ajustes académicos temporales</li>
                      </ul>
                    ) : estudiante.estadoActual.estadoRiesgo === 'MEDIO' ? (
                      <ul className="text-blue-800 space-y-1">
                        <li>• Ofrecer recursos de manejo del estrés</li>
                        <li>• Programar check-in en 2 semanas</li>
                        <li>• Monitorear evaluaciones futuras</li>
                      </ul>
                    ) : (
                      <ul className="text-blue-800 space-y-1">
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
                    <div key={evaluacion.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {formatearFecha(evaluacion.fechaEvaluacion)}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(evaluacion.nivelRiesgo).bg} ${getRiskColor(evaluacion.nivelRiesgo).text}`}>
                          {evaluacion.nivelRiesgo}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-red-600">{evaluacion.puntajeEstres}/10</div>
                          <div className="text-xs text-gray-500">Estrés</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{evaluacion.puntajeBurnout}/10</div>
                          <div className="text-xs text-gray-500">Burnout</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{evaluacion.puntajeTotal}/10</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay evaluaciones registradas</p>
                )}
              </div>
            )}

            {vistaActual === 'alertas' && (
              <div className="space-y-4">
                {alertas.length > 0 ? (
                  alertas.map((alerta) => (
                    <div key={alerta.id} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(alerta.severidad).bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{alerta.tipoAlerta}</h4>
                        <span className="text-sm text-gray-500">
                          {formatearFecha(alerta.fechaCreacion)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{alerta.mensaje}</p>
                      {!alerta.estaLeida && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Sin leer
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay alertas registradas</p>
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