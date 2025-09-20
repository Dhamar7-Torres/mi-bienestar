import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { alertService } from '../../services/alertService';
import { ALERT_PRIORITIES } from '../../utils/constants';
import { AlertTriangle, CheckCircle, Clock, Filter, Mail, User } from 'lucide-react';

export const AlertsSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showRead, setShowRead] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(new Set());

  useEffect(() => {
    loadAlerts();
  }, [selectedPriority, showRead]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (selectedPriority !== 'all') {
        filters.nivel_prioridad = selectedPriority;
      }
      
      if (!showRead) {
        filters.leida = false;
      }
      
      const response = await alertService.getAll(filters);
      setAlerts(response.data);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      setMarkingAsRead(prev => new Set(prev).add(alertId));
      await alertService.markAsRead(alertId);
      
      // Actualizar estado local
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, leida: true, fecha_leida: new Date().toISOString() }
          : alert
      ));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const handleMarkMultipleAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(alert => !alert.leida).map(alert => alert.id);
      if (unreadAlerts.length === 0) return;
      
      await alertService.markMultipleAsRead(unreadAlerts);
      loadAlerts(); // Recargar alertas
    } catch (err) {
      console.error('Error marking multiple alerts as read:', err);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICA':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'ALTA':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'MEDIA':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    );
  }

  const unreadCount = alerts.filter(alert => !alert.leida).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Alertas</h2>
          <p className="text-gray-600 mt-1">
            Monitoreo de alertas y notificaciones del sistema
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="primary" 
            onClick={handleMarkMultipleAsRead}
            className="mt-4 sm:mt-0"
          >
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filters and Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="CRITICA">Crítica</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRead}
                  onChange={(e) => setShowRead(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mostrar leídas</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Sin leer: {unreadCount}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Total: {alerts.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showRead ? 'No hay alertas' : '¡No hay alertas pendientes!'}
            </h3>
            <p className="text-gray-600">
              {showRead 
                ? 'No se encontraron alertas con los filtros seleccionados.'
                : 'Todas las alertas han sido atendidas. El sistema está funcionando correctamente.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const priorityInfo = ALERT_PRIORITIES[alert.nivel_prioridad];
            const isMarking = markingAsRead.has(alert.id);
            
            return (
              <Card 
                key={alert.id} 
                className={`transition-all duration-200 ${
                  alert.leida 
                    ? 'bg-gray-50 border-gray-200' 
                    : `border-l-4 ${
                        alert.nivel_prioridad === 'CRITICA' ? 'border-l-red-500 bg-red-50' :
                        alert.nivel_prioridad === 'ALTA' ? 'border-l-orange-500 bg-orange-50' :
                        alert.nivel_prioridad === 'MEDIA' ? 'border-l-yellow-500 bg-yellow-50' :
                        'border-l-blue-500 bg-blue-50'
                      }`
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Priority Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(alert.nivel_prioridad)}
                      </div>
                      
                      {/* Alert Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {alert.tipo.replace(/_/g, ' ')}
                          </span>
                          {!alert.leida && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Nuevo
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-3 ${alert.leida ? 'text-gray-600' : 'text-gray-900'}`}>
                          {alert.mensaje}
                        </p>
                        
                        {/* Student Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{alert.estudiante_nombre}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            <span>{alert.estudiante_email}</span>
                          </div>
                          {alert.estudiante_carrera && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {alert.estudiante_carrera}
                            </span>
                          )}
                        </div>
                        
                        {/* Timestamps */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Generada: {getTimeAgo(alert.fecha_alerta)}</div>
                          {alert.leida && alert.fecha_leida && (
                            <div>Leída: {getTimeAgo(alert.fecha_leida)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 ml-4">
                      {!alert.leida ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(alert.id)}
                          disabled={isMarking}
                          loading={isMarking}
                        >
                          {isMarking ? 'Marcando...' : 'Marcar como leída'}
                        </Button>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Leída</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Risk Level Indicator */}
                  {alert.nivel_riesgo && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Nivel de riesgo del estudiante:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.nivel_riesgo === 'ALTO' ? 'bg-red-100 text-red-800' :
                          alert.nivel_riesgo === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {alert.nivel_riesgo}
                        </span>
                      </div>
                      {alert.promedio_general && (
                        <div className="text-xs text-gray-500 mt-1">
                          Promedio general: {alert.promedio_general.toFixed(1)}/10
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ALERT_PRIORITIES).map(([priority, info]) => {
              const count = alerts.filter(alert => alert.nivel_prioridad === priority).length;
              const unreadCount = alerts.filter(alert => alert.nivel_prioridad === priority && !alert.leida).length;
              
              return (
                <div key={priority} className="text-center p-4 border rounded-lg">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${info.bgColor}`}>
                    <span className={`text-lg font-bold ${info.color}`}>
                      {count}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">{info.label}</p>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};