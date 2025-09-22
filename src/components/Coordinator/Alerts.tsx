import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { AlertaCompleta } from '../../types';

interface AlertsResponse {
  alertas: AlertaCompleta[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

function Alerts() {
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  
  // Estados adicionales para manejo de alertas leídas
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const limite = 20;

  useEffect(() => {
    fetchAlerts();
  }, [paginaActual]);

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        pagina: paginaActual,
        limite
      };
      
      const response = await apiService.getAlerts(params);
      
      if (response.success) {
        setAlertsData(response.data);
      } else {
        setError(response.message || 'Error al cargar las alertas');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlert = (alertId: number) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === alertsData?.alertas.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alertsData?.alertas.map(alert => alert.id) || []);
    }
  };

  const markAlertsAsRead = async () => {
    if (selectedAlerts.length === 0) {
      setError('No hay alertas seleccionadas para marcar como leídas');
      return;
    }
    
    try {
      setIsMarkingAsRead(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Marcando alertas como leídas:', selectedAlerts);
      
      const response = await apiService.markAlertsAsRead(selectedAlerts);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setSuccessMessage(`✅ ${selectedAlerts.length} alerta${selectedAlerts.length > 1 ? 's' : ''} marcada${selectedAlerts.length > 1 ? 's' : ''} como leída${selectedAlerts.length > 1 ? 's' : ''} exitosamente`);
        setSelectedAlerts([]);
        
        // Recargar alertas después de un pequeño delay para que se vea el mensaje
        setTimeout(async () => {
          await fetchAlerts();
        }, 500);
      } else {
        setError(response.message || 'Error al marcar las alertas como leídas');
      }
    } catch (error: any) {
      console.error('Error marcando alertas como leídas:', error);
      setError(error.message || 'Error de conexión al procesar las alertas');
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const getSeverityIcon = (severidad: string) => {
    switch (severidad) {
      case 'ALTO': return '🚨';
      case 'MEDIO': return '⚠️';
      case 'BAJO': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityColor = (severidad: string) => {
    const colors = COLORES_RIESGO[severidad as keyof typeof COLORES_RIESGO];
    return colors || COLORES_RIESGO.BAJO;
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

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando alertas..." />
      </div>
    );
  }

  if (error && !alertsData) {
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Error al cargar alertas</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchAlerts}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!alertsData) return null;

  // Separar alertas
  const alertasNuevas = alertsData.alertas.filter(alerta => !alerta.estaLeida);
  const alertasLeidas = alertsData.alertas.filter(alerta => alerta.estaLeida);

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
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Gestión de Alertas 🚨
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Monitor las alertas de riesgo y toma acciones preventivas
            </p>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-xl shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-500 transition-colors duration-200"
                  >
                    <span className="sr-only">Cerrar</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-xl shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-green-500 text-xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-500 transition-colors duration-200"
                  >
                    <span className="sr-only">Cerrar</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Acciones masivas */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === alertsData.alertas.length && alertsData.alertas.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Seleccionar todas ({selectedAlerts.length})
                  </span>
                </label>

                {selectedAlerts.length > 0 && (
                  <button
                    onClick={markAlertsAsRead}
                    disabled={isMarkingAsRead}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transform transition-all duration-200 text-sm ${
                      isMarkingAsRead
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {isMarkingAsRead ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : (
                      `Marcar como leídas (${selectedAlerts.length})`
                    )}
                  </button>
                )}
              </div>

              <div className="text-sm font-medium text-gray-600 flex items-center space-x-4">
                <span>
                  {alertsData.paginacion.total} alerta{alertsData.paginacion.total !== 1 ? 's' : ''} total{alertsData.paginacion.total !== 1 ? 'es' : ''}
                </span>
                {alertsData.alertas.length > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>{alertasNuevas.length} sin leer</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{alertasLeidas.length} leídas</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* DOS COLUMNAS PARA ALERTAS */}
          {alertsData.alertas.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* COLUMNA IZQUIERDA: ALERTAS NUEVAS */}
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">🚨 Alertas Nuevas</h2>
                    <p className="text-sm text-gray-600 mt-1">Requieren atención inmediata</p>
                  </div>
                  <div className="bg-red-100 text-red-700 px-4 py-2 rounded-2xl font-bold text-lg">
                    {alertasNuevas.length}
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {alertasNuevas.length > 0 ? (
                    alertasNuevas.map((alerta) => {
                      const severityColors = getSeverityColor(alerta.severidad);
                      const isSelected = selectedAlerts.includes(alerta.id);
                      
                      return (
                        <div 
                          key={alerta.id}
                          className={`bg-white border-2 rounded-2xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-200 p-5 ${
                            isSelected ? 'border-cyan-400 ring-4 ring-cyan-200' : 'border-gray-200'
                          } hover:-translate-y-1`}
                          onClick={() => handleSelectAlert(alerta.id)}
                        >
                          <div className="flex items-start space-x-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectAlert(alerta.id);
                              }}
                              className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 mt-2"
                            />
                            
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityColors.bg} shadow-lg`}>
                                <span className="text-xl">
                                  {getSeverityIcon(alerta.severidad)}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-gray-900">
                                  {alerta.estudiante.nombre}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${severityColors.bg} ${severityColors.text}`}>
                                  {alerta.severidad}
                                </span>
                              </div>
                              
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                {alerta.tipo}
                              </p>
                              
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {alerta.mensaje}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="font-medium">📚 {alerta.estudiante.carrera}</span>
                                <span className="font-medium">{alerta.tiempoTranscurrido}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-lg font-bold text-gray-600 mb-2">¡Sin alertas nuevas!</h3>
                      <p className="text-gray-500">Todas las alertas están procesadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: ALERTAS LEÍDAS */}
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">✅ Alertas Procesadas</h2>
                    <p className="text-sm text-gray-600 mt-1">Ya han sido revisadas</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-bold text-lg">
                    {alertasLeidas.length}
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {alertasLeidas.length > 0 ? (
                    alertasLeidas.map((alerta) => {
                      const severityColors = getSeverityColor(alerta.severidad);
                      const isSelected = selectedAlerts.includes(alerta.id);
                      
                      return (
                        <div 
                          key={alerta.id}
                          className={`bg-white border-2 rounded-2xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-200 p-5 ${
                            isSelected ? 'border-cyan-400 ring-4 ring-cyan-200' : 'border-gray-200'
                          } hover:-translate-y-1`}
                          onClick={() => handleSelectAlert(alerta.id)}
                        >
                          <div className="flex items-start space-x-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectAlert(alerta.id);
                              }}
                              className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 mt-2"
                            />
                            
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityColors.bg} shadow-lg`}>
                                <span className="text-xl">
                                  {getSeverityIcon(alerta.severidad)}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-gray-900">
                                  {alerta.estudiante.nombre}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${severityColors.bg} ${severityColors.text}`}>
                                  {alerta.severidad}
                                </span>
                              </div>
                              
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                {alerta.tipo}
                              </p>
                              
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {alerta.mensaje}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="font-medium">📚 {alerta.estudiante.carrera}</span>
                                <span className="font-medium">{alerta.tiempoTranscurrido}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-bold text-gray-600 mb-2">Sin alertas procesadas</h3>
                      <p className="text-gray-500">Las alertas marcadas aparecerán aquí</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 inline-block">
                <div className="text-gray-400 text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent mb-3">
                  No hay alertas
                </h3>
                <p className="text-gray-600 font-medium">
                  No se encontraron alertas en este momento
                </p>
              </div>
            </div>
          )}

          {/* Paginación */}
          {alertsData.paginacion.totalPaginas > 1 && (
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 mt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 font-medium">
                  Mostrando {((alertsData.paginacion.pagina - 1) * alertsData.paginacion.limite) + 1} a{' '}
                  {Math.min(alertsData.paginacion.pagina * alertsData.paginacion.limite, alertsData.paginacion.total)} de{' '}
                  {alertsData.paginacion.total} alertas
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
                    Página {paginaActual} de {alertsData.paginacion.totalPaginas}
                  </span>
                  
                  <button
                    onClick={() => setPaginaActual(Math.min(alertsData.paginacion.totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === alertsData.paginacion.totalPaginas}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white/70 border-2 border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

export default Alerts;