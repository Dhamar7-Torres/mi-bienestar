import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { alertService } from '../../services/alertService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export const GeneralSummary = () => {
  const [stats, setStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, alertStatsResponse] = await Promise.all([
        studentService.getStats(),
        alertService.getStats()
      ]);
      
      setStats(statsResponse.data);
      setAlertStats(alertStatsResponse.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    );
  }

  // Datos para gráficos
  const riskDistributionData = stats?.distribucionRiesgo ? [
    { name: 'Bajo', value: stats.distribucionRiesgo.BAJO || 0, color: '#10B981' },
    { name: 'Medio', value: stats.distribucionRiesgo.MEDIO || 0, color: '#F59E0B' },
    { name: 'Alto', value: stats.distribucionRiesgo.ALTO || 0, color: '#EF4444' }
  ] : [];

  const alertTrendData = alertStats?.tendenciaSemanal?.map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString(),
    alertas: parseInt(item.cantidad)
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen General</h2>
        <p className="text-gray-600 mt-1">
          Panel de control administrativo - Sistema Mi Bienestar DACYTI
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalEstudiantes || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.alertasActivas || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasa de Respuesta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.tasaRespuesta || '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Evaluaciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalEvaluaciones || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Niveles de Riesgo</CardTitle>
            <p className="text-sm text-gray-600">Últimas evaluaciones (30 días)</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alert Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Alertas</CardTitle>
            <p className="text-sm text-gray-600">Últimos 7 días</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="alertas" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Alertas por Prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {alertStats?.porPrioridad?.map((priority) => (
              <div key={priority.nivel_prioridad} className="text-center p-4 border rounded-lg">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                  priority.nivel_prioridad === 'CRITICA' ? 'bg-red-100' :
                  priority.nivel_prioridad === 'ALTA' ? 'bg-orange-100' :
                  priority.nivel_prioridad === 'MEDIA' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    priority.nivel_prioridad === 'CRITICA' ? 'text-red-600' :
                    priority.nivel_prioridad === 'ALTA' ? 'text-orange-600' :
                    priority.nivel_prioridad === 'MEDIA' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {priority.cantidad}
                  </span>
                </div>
                <p className="font-medium text-gray-900">
                  {priority.nivel_prioridad === 'CRITICA' ? 'Crítica' :
                   priority.nivel_prioridad === 'ALTA' ? 'Alta' :
                   priority.nivel_prioridad === 'MEDIA' ? 'Media' : 'Baja'}
                </p>
                <p className="text-sm text-gray-600">
                  {priority.no_leidas} sin leer
                </p>
              </div>
            )) || (
              <div className="col-span-4 text-center text-gray-500 py-8">
                No hay datos de alertas disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evaluaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats?.totalEvaluaciones || 0}
              </div>
              <p className="text-sm text-gray-600">Esta semana</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estudiantes en Riesgo Alto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-3xl font-bold text-danger-600 mb-2">
                {stats?.distribucionRiesgo?.ALTO || 0}
              </div>
              <p className="text-sm text-gray-600">Requieren atención</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                {Math.round((stats?.totalEvaluaciones || 0) / 7)}
              </div>
              <p className="text-sm text-gray-600">Evaluaciones por día</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};