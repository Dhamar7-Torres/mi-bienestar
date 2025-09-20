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
  
  // Filtros
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [filtroLeidas, setFiltroLeidas] = useState('false');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  
  const limite = 20;

  useEffect(() => {
    fetchAlerts();
  }, [filtroSeveridad, filtroLeidas, fechaDesde, fechaHasta, paginaActual]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
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
    if (selectedAlerts.length === 0) return;
    
    try {
      const response = await apiService.markAlertsAsRead(selectedAlerts);
      if (response.success) {
        setSelectedAlerts([]);
        fetchAlerts(); // Recargar alertas
      }
    } catch (error) {
      console.error('Error marcando alertas como leídas:', error);
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
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando alertas..." />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar alertas</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAlerts}
              className="btn-primary"
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
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Alertas 🚨
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor las alertas de riesgo y toma acciones preventivas
            </p>
          </div>

          {/* Filtros */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label htmlFor="severidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Severidad
                </label>
                <select
                  id="severidad"
                  value={filtroSeveridad}
                  onChange={(e) => setFiltroSeveridad(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="ALTO">Alta</option>
                  <option value="MEDIO">Media</option>
                  <option value="BAJO">Baja</option>
                </select>
              </div>

              <div>
                <label htmlFor="leidas" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="leidas"
                  value={filtroLeidas}
                  onChange={(e) => setFiltroLeidas(e.target.value)}
                  className="input-field"
                >
                  <option value="false">Sin leer</option>
                  <option value="true">Leídas</option>
                </select>
              </div>

              <div>
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  id="fechaDesde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  id="fechaHasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="btn-secondary w-full"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Acciones masivas */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === alertsData.alertas.length && alertsData.alertas.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Seleccionar todas ({selectedAlerts.length})
                  </span>
                </label>

                {selectedAlerts.length > 0 && (
                  <button
                    onClick={markAlertsAsRead}
                    className="btn-primary text-sm"
                  >
                    Marcar como leídas ({selectedAlerts.length})
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {alertsData.paginacion.total} alerta{alertsData.paginacion.total !== 1 ? 's' : ''}
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
                    className={`card cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${alerta.estaLeida ? 'opacity-75' : 'shadow-md'}`}
                    onClick={() => handleSelectAlert(alerta.id)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectAlert(alerta.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      {/* Icono de severidad */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${severityColors.bg}`}>
                          <span className="text-xl">
                            {getSeverityIcon(alerta.severidad)}
                          </span>
                        </div>
                      </div>

                      {/* Contenido de la alerta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {alerta.estudiante.nombre}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColors.bg} ${severityColors.text}`}>
                              {alerta.severidad}
                            </span>
                            {!alerta.estaLeida && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Nueva
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {alerta.tiempoTranscurrido}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-800">
                            {alerta.tipo}
                          </p>
                          <p className="text-sm text-gray-600">
                            {alerta.mensaje}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>
                              📚 {alerta.estudiante.carrera}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${getSeverityColor(alerta.estudiante.estadoRiesgo).bg} ${getSeverityColor(alerta.estudiante.estadoRiesgo).text}`}>
                              Riesgo {alerta.estudiante.estadoRiesgo}
                            </span>
                          </div>
                          <span>
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
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Mostrando {((alertsData.paginacion.pagina - 1) * alertsData.paginacion.limite) + 1} a{' '}
                      {Math.min(alertsData.paginacion.pagina * alertsData.paginacion.limite, alertsData.paginacion.total)} de{' '}
                      {alertsData.paginacion.total} alertas
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
                        Página {paginaActual} de {alertsData.paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaActual(Math.min(alertsData.paginacion.totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === alertsData.paginacion.totalPaginas}
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
              <div className="text-gray-400 text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay alertas
              </h3>
              <p className="text-gray-600">
                {filtroLeidas === 'false' ? 
                  'No hay alertas sin leer en este momento' :
                  'No se encontraron alertas con los filtros aplicados'
                }
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💡 Sobre las Alertas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-red-800 mb-2 flex items-center">
                  🚨 <span className="ml-2">Alertas de Riesgo Alto</span>
                </h3>
                <p className="text-gray-600 text-sm">
                  Requieren atención inmediata. El estudiante presenta niveles críticos de estrés o burnout.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                  ⚠️ <span className="ml-2">Alertas de Riesgo Medio</span>
                </h3>
                <p className="text-gray-600 text-sm">
                  Situaciones que requieren seguimiento. Es recomendable contactar al estudiante.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                  ℹ️ <span className="ml-2">Alertas Informativas</span>
                </h3>
                <p className="text-gray-600 text-sm">
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