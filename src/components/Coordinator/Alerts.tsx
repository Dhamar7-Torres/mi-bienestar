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
  
  // Estados adicionales para el botón "marcar como leídas"
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filtros
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [filtroLeidas, setFiltroLeidas] = useState(''); // Cambiado para mostrar todas por defecto
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  
  const limite = 20;

  useEffect(() => {
    fetchAlerts();
  }, [filtroSeveridad, filtroLeidas, fechaDesde, fechaHasta, paginaActual]);

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

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null); // Limpiar errores previos
      const response = await apiService.getAlerts({
        severidad: filtroSeveridad || undefined,
        leidas: filtroLeidas === 'true',
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        pagina: paginaActual,
        limite
      });
      
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
      setError('No hay alertas seleccionadas');
      return;
    }
    
    try {
      setIsMarkingAsRead(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Marcando alertas como leídas:', selectedAlerts); // Debug log
      
      const response = await apiService.markAlertsAsRead(selectedAlerts);
      
      console.log('Respuesta del API:', response); // Debug log
      
      if (response.success) {
        setSuccessMessage(`${selectedAlerts.length} alerta${selectedAlerts.length > 1 ? 's' : ''} marcada${selectedAlerts.length > 1 ? 's' : ''} como leída${selectedAlerts.length > 1 ? 's' : ''}`);
        setSelectedAlerts([]);
        await fetchAlerts(); // Recargar alertas
      } else {
        setError(response.message || 'Error al marcar las alertas como leídas');
      }
    } catch (error: any) {
      console.error('Error marcando alertas como leídas:', error);
      setError(error.message || 'Error al procesar la solicitud');
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

  const limpiarFiltros = () => {
    setFiltroSeveridad('');
    setFiltroLeidas('false');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
    setSelectedAlerts([]);
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

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex bg-red-100 rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-100 focus:ring-red-500"
                    >
                      <span className="sr-only">Cerrar</span>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-500">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setSuccessMessage(null)}
                      className="inline-flex bg-green-100 rounded-md p-1.5 text-green-500 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-100 focus:ring-green-500"
                    >
                      <span className="sr-only">Cerrar</span>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label htmlFor="severidad" className="block text-sm font-semibold text-gray-700 mb-2">
                  Severidad
                </label>
                <select
                  id="severidad"
                  value={filtroSeveridad}
                  onChange={(e) => setFiltroSeveridad(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                >
                  <option value="">Todas</option>
                  <option value="ALTO">Alta</option>
                  <option value="MEDIO">Media</option>
                  <option value="BAJO">Baja</option>
                </select>
              </div>

              <div>
                <label htmlFor="leidas" className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="leidas"
                  value={filtroLeidas}
                  onChange={(e) => setFiltroLeidas(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                >
                  <option value="">Todas las alertas</option>
                  <option value="false">Sin leer</option>
                  <option value="true">Leídas</option>
                </select>
              </div>

              <div>
                <label htmlFor="fechaDesde" className="block text-sm font-semibold text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  id="fechaDesde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                />
              </div>

              <div>
                <label htmlFor="fechaHasta" className="block text-sm font-semibold text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  id="fechaHasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Acciones masivas */}
            <div className="flex items-center justify-between pt-4 border-t border-white/30">
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
                        Marcando...
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
                      <span>{alertsData.alertas.filter(a => !a.estaLeida).length} sin leer</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>{alertsData.alertas.filter(a => a.estaLeida).length} leídas</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lista de alertas */}
          {alertsData.alertas.length > 0 ? (
            <div className="space-y-4">
              {alertsData.alertas.map((alerta) => {
                const severityColors = getSeverityColor(alerta.severidad);
                const isSelected = selectedAlerts.includes(alerta.id);
                
                return (
                  <div 
                    key={alerta.id}
                    className={`bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-200 p-6 ${
                      isSelected ? 'ring-2 ring-cyan-500 shadow-cyan-200/50' : ''
                    } ${alerta.estaLeida ? 'opacity-75' : 'shadow-md'} hover:-translate-y-1`}
                    onClick={() => handleSelectAlert(alerta.id)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectAlert(alerta.id);
                          }}
                          className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                        />
                      </div>

                      {/* Icono de severidad */}
                      <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${severityColors.bg} shadow-lg`}>
                          <span className="text-2xl">
                            {getSeverityIcon(alerta.severidad)}
                          </span>
                        </div>
                      </div>

                      {/* Contenido de la alerta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {alerta.estudiante.nombre}
                            </h3>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${severityColors.bg} ${severityColors.text} shadow-sm`}>
                              {alerta.severidad}
                            </span>
                            {!alerta.estaLeida && (
                              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm">
                                Nueva
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-500">
                            {alerta.tiempoTranscurrido}
                          </span>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            {alerta.tipo}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {alerta.mensaje}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">
                              📚 {alerta.estudiante.carrera}
                            </span>
                            <span className={`px-2 py-1 rounded-full font-semibold ${getSeverityColor(alerta.estudiante.estadoRiesgo).bg} ${getSeverityColor(alerta.estudiante.estadoRiesgo).text}`}>
                              Riesgo {alerta.estudiante.estadoRiesgo}
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatearFecha(alerta.fechaCreacion)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Paginación */}
              {alertsData.paginacion.totalPaginas > 1 && (
                <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6">
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
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 inline-block">
                <div className="text-gray-400 text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent mb-3">
                  No hay alertas
                </h3>
                <p className="text-gray-600 font-medium">
                  {filtroLeidas === '' ? 
                    'No se encontraron alertas con los filtros aplicados' :
                    filtroLeidas === 'false' ? 
                      'No hay alertas sin leer en este momento' :
                      'No hay alertas leídas en este momento'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-8 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
              💡 Sobre las Alertas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center text-lg">
                  🚨 <span className="ml-2">Alertas de Riesgo Alto</span>
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">
                  Requieren atención inmediata. El estudiante presenta niveles críticos de estrés o burnout.
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center text-lg">
                  ⚠️ <span className="ml-2">Alertas de Riesgo Medio</span>
                </h3>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  Situaciones que requieren seguimiento. Es recomendable contactar al estudiante.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center text-lg">
                  ℹ️ <span className="ml-2">Alertas Informativas</span>
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Información general sobre cambios en el estado del estudiante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;