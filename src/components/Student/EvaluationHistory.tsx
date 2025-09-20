import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { Evaluacion } from '../../types';
import { Link } from 'react-router-dom';

interface EvaluationHistoryResponse {
  evaluaciones: Evaluacion[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

function EvaluationHistory() {
  const [historyData, setHistoryData] = useState<EvaluationHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<Evaluacion | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const limite = 10;

  useEffect(() => {
    fetchHistory();
  }, [paginaActual]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getEvaluationHistory({
        pagina: paginaActual,
        limite
      });
      
      if (response.success) {
        setHistoryData(response.data);
      } else {
        setError(response.message || 'Error al cargar el historial');
      }
    } catch (error: any) {
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
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

  const verDetalles = (evaluacion: Evaluacion) => {
    setEvaluacionSeleccionada(evaluacion);
    setMostrarDetalles(true);
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setEvaluacionSeleccionada(null);
  };

  const calcularTendencia = (evaluaciones: Evaluacion[]) => {
    if (evaluaciones.length < 2) return null;
    
    const ultima = evaluaciones[0];
    const anterior = evaluaciones[1];
    
    const cambioEstres = ultima.puntajeEstres - anterior.puntajeEstres;
    const cambioBurnout = ultima.puntajeBurnout - anterior.puntajeBurnout;
    
    return { cambioEstres, cambioBurnout };
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando historial..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar historial</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchHistory}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!historyData) return null;

  const tendencia = calcularTendencia(historyData.evaluaciones);

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Mi Historial de Evaluaciones 📊
            </h1>
            <p className="mt-2 text-gray-600">
              Revisa tu progreso y evolución en el tiempo
            </p>
          </div>

          {/* Resumen de tendencias */}
          {tendencia && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tendencia Reciente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  tendencia.cambioEstres > 0 ? 'bg-red-50' : 
                  tendencia.cambioEstres < 0 ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {tendencia.cambioEstres > 0 ? '📈' : 
                       tendencia.cambioEstres < 0 ? '📉' : '➖'}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">Nivel de Estrés</h3>
                      <p className={`text-sm ${
                        tendencia.cambioEstres > 0 ? 'text-red-600' : 
                        tendencia.cambioEstres < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tendencia.cambioEstres > 0 ? '+' : ''}{tendencia.cambioEstres} puntos
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  tendencia.cambioBurnout > 0 ? 'bg-orange-50' : 
                  tendencia.cambioBurnout < 0 ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {tendencia.cambioBurnout > 0 ? '📈' : 
                       tendencia.cambioBurnout < 0 ? '📉' : '➖'}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">Nivel de Burnout</h3>
                      <p className={`text-sm ${
                        tendencia.cambioBurnout > 0 ? 'text-orange-600' : 
                        tendencia.cambioBurnout < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tendencia.cambioBurnout > 0 ? '+' : ''}{tendencia.cambioBurnout} puntos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de evaluaciones */}
          {historyData.evaluaciones.length > 0 ? (
            <div className="space-y-4">
              {historyData.evaluaciones.map((evaluacion, index) => {
                const riskColors = getRiskColor(evaluacion.nivelRiesgo);
                const esReciente = index === 0;
                
                return (
                  <div 
                    key={evaluacion.id}
                    className={`card hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      esReciente ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => verDetalles(evaluacion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {esReciente && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Más reciente
                          </span>
                        )}
                        
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatearFecha(evaluacion.fechaEvaluacion)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Evaluación #{historyData.paginacion.total - ((paginaActual - 1) * limite + index)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {evaluacion.puntajeEstres}/10
                          </div>
                          <div className="text-xs text-gray-500">Estrés</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {evaluacion.puntajeBurnout}/10
                          </div>
                          <div className="text-xs text-gray-500">Burnout</div>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${riskColors.bg} ${riskColors.text}`}>
                            {evaluacion.nivelRiesgo}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verDetalles(evaluacion);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Ver detalles →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Paginación */}
              {historyData.paginacion.totalPaginas > 1 && (
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Mostrando {((historyData.paginacion.pagina - 1) * historyData.paginacion.limite) + 1} a{' '}
                      {Math.min(historyData.paginacion.pagina * historyData.paginacion.limite, historyData.paginacion.total)} de{' '}
                      {historyData.paginacion.total} evaluaciones
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Página {paginaActual} de {historyData.paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaActual(Math.min(historyData.paginacion.totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === historyData.paginacion.totalPaginas}
                        className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin evaluaciones aún
              </h3>
              <p className="text-gray-600 mb-4">
                Realiza tu primera evaluación para comenzar a monitorear tu bienestar
              </p>
              <Link 
                to="/estudiante/evaluacion"
                className="btn-primary"
              >
                Hacer Evaluación
              </Link>
            </div>
          )}

          {/* Modal de detalles */}
          {mostrarDetalles && evaluacionSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Detalles de Evaluación
                    </h2>
                    <button
                      onClick={cerrarDetalles}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Información General</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Fecha:</span>
                            <p className="font-medium">{formatearFecha(evaluacionSeleccionada.fechaEvaluacion)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Nivel de Riesgo:</span>
                            <div className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getRiskColor(evaluacionSeleccionada.nivelRiesgo).bg} ${getRiskColor(evaluacionSeleccionada.nivelRiesgo).text}`}>
                              {evaluacionSeleccionada.nivelRiesgo}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Puntajes Obtenidos</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {evaluacionSeleccionada.puntajeEstres}/10
                          </div>
                          <div className="text-sm text-gray-600">Nivel de Estrés</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {evaluacionSeleccionada.puntajeBurnout}/10
                          </div>
                          <div className="text-sm text-gray-600">Nivel de Burnout</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {evaluacionSeleccionada.puntajeTotal}/10
                          </div>
                          <div className="text-sm text-gray-600">Puntaje Total</div>
                        </div>
                      </div>
                    </div>

                    {evaluacionSeleccionada.respuestas && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Distribución de Respuestas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2">Estrés</h4>
                            <div className="space-y-1">
                              {(evaluacionSeleccionada.respuestas as any).estres?.map((respuesta: number, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>Pregunta {index + 1}:</span>
                                  <span className="font-medium">{respuesta}/4</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <h4 className="font-medium text-orange-800 mb-2">Burnout</h4>
                            <div className="space-y-1">
                              {(evaluacionSeleccionada.respuestas as any).burnout?.map((respuesta: number, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>Pregunta {index + 1}:</span>
                                  <span className="font-medium">{respuesta}/4</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={cerrarDetalles}
                      className="btn-secondary"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EvaluationHistory;