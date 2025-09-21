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
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-600 text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Error al cargar historial</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchHistory}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
      
      <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Mi Historial de Evaluaciones 📊
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Revisa tu progreso y evolución en el tiempo
            </p>
          </div>

          {/* Resumen de tendencias */}
          {tendencia && (
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Tendencia Reciente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border shadow-sm ${
                  tendencia.cambioEstres > 0 ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' : 
                  tendencia.cambioEstres < 0 ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {tendencia.cambioEstres > 0 ? '📈' : 
                       tendencia.cambioEstres < 0 ? '📉' : '➖'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Nivel de Estrés</h3>
                      <p className={`text-sm font-bold ${
                        tendencia.cambioEstres > 0 ? 'text-red-600' : 
                        tendencia.cambioEstres < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tendencia.cambioEstres > 0 ? '+' : ''}{tendencia.cambioEstres} puntos
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${
                  tendencia.cambioBurnout > 0 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' : 
                  tendencia.cambioBurnout < 0 ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {tendencia.cambioBurnout > 0 ? '📈' : 
                       tendencia.cambioBurnout < 0 ? '📉' : '➖'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Nivel de Burnout</h3>
                      <p className={`text-sm font-bold ${
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
                    className={`bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer p-6 hover:-translate-y-1 ${
                      esReciente ? 'ring-2 ring-cyan-500 shadow-cyan-200/50' : ''
                    }`}
                    onClick={() => verDetalles(evaluacion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {esReciente && (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm">
                            Más reciente
                          </span>
                        )}
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formatearFecha(evaluacion.fechaEvaluacion)}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            Evaluación #{historyData.paginacion.total - ((paginaActual - 1) * limite + index)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {evaluacion.puntajeEstres}/10
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Estrés</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {evaluacion.puntajeBurnout}/10
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Burnout</div>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${riskColors.bg} ${riskColors.text} shadow-sm`}>
                            {evaluacion.nivelRiesgo}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verDetalles(evaluacion);
                          }}
                          className="text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 text-sm font-semibold transition-all duration-200"
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
                <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-medium">
                      Mostrando {((historyData.paginacion.pagina - 1) * historyData.paginacion.limite) + 1} a{' '}
                      {Math.min(historyData.paginacion.pagina * historyData.paginacion.limite, historyData.paginacion.total)} de{' '}
                      {historyData.paginacion.total} evaluaciones
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white/70 border-2 border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Anterior
                      </button>
                      
                      <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                        Página {paginaActual} de {historyData.paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaActual(Math.min(historyData.paginacion.totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === historyData.paginacion.totalPaginas}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white/70 border-2 border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 inline-block">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent mb-3">
                  Sin evaluaciones aún
                </h3>
                <p className="text-gray-600 mb-6 font-medium">
                  Realiza tu primera evaluación para comenzar a monitorear tu bienestar
                </p>
                <Link 
                  to="/estudiante/evaluacion"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Hacer Evaluación
                </Link>
              </div>
            </div>
          )}

          {/* Modal de detalles */}
          {mostrarDetalles && evaluacionSeleccionada && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Detalles de Evaluación
                    </h2>
                    <button
                      onClick={cerrarDetalles}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Fecha:</span>
                            <p className="font-semibold text-gray-900">{formatearFecha(evaluacionSeleccionada.fechaEvaluacion)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Nivel de Riesgo:</span>
                            <div className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getRiskColor(evaluacionSeleccionada.nivelRiesgo).bg} ${getRiskColor(evaluacionSeleccionada.nivelRiesgo).text} shadow-sm mt-1`}>
                              {evaluacionSeleccionada.nivelRiesgo}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Puntajes Obtenidos</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
                          <div className="text-2xl font-bold text-red-600">
                            {evaluacionSeleccionada.puntajeEstres}/10
                          </div>
                          <div className="text-sm text-gray-700 font-medium">Nivel de Estrés</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
                          <div className="text-2xl font-bold text-orange-600">
                            {evaluacionSeleccionada.puntajeBurnout}/10
                          </div>
                          <div className="text-sm text-gray-700 font-medium">Nivel de Burnout</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600">
                            {evaluacionSeleccionada.puntajeTotal}/10
                          </div>
                          <div className="text-sm text-gray-700 font-medium">Puntaje Total</div>
                        </div>
                      </div>
                    </div>

                    {evaluacionSeleccionada.respuestas && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Distribución de Respuestas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 rounded-xl">
                            <h4 className="font-semibold text-red-800 mb-2">Estrés</h4>
                            <div className="space-y-1">
                              {(evaluacionSeleccionada.respuestas as any).estres?.map((respuesta: number, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="font-medium">Pregunta {index + 1}:</span>
                                  <span className="font-bold">{respuesta}/4</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-xl">
                            <h4 className="font-semibold text-orange-800 mb-2">Burnout</h4>
                            <div className="space-y-1">
                              {(evaluacionSeleccionada.respuestas as any).burnout?.map((respuesta: number, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="font-medium">Pregunta {index + 1}:</span>
                                  <span className="font-bold">{respuesta}/4</span>
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
                      className="px-6 py-3 text-gray-700 bg-white/70 border-2 border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
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