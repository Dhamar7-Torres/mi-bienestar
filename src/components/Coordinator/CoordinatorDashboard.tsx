import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { ROUTES, COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { DashboardCoordinador } from '../../types';

function CoordinatorDashboard() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardCoordinador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getCoordinatorDashboard();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Error al cargar el dashboard');
        }
      } catch (error: any) {
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (nivel: string) => {
    return COLORES_RIESGO[nivel as keyof typeof COLORES_RIESGO] || COLORES_RIESGO.BAJO;
  };

  const getTiempoTranscurrido = (fechaCreacion: string) => {
    const ahora = new Date();
    const fecha = new Date(fechaCreacion);
    const diferencia = ahora.getTime() - fecha.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    
    if (horas < 1) {
      const minutos = Math.floor(diferencia / (1000 * 60));
      return `hace ${minutos} min`;
    } else if (horas < 24) {
      return `hace ${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      return `hace ${dias}d`;
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando dashboard del coordinador..." />
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
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { resumenGeneral, estudiantesRiesgoAlto, alertasRecientes, tendenciasSemanales } = dashboardData!;

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Control - Coordinador 📊
            </h1>
            <p className="mt-2 text-gray-600">
              Bienvenido, {usuario?.nombreCompleto}
            </p>
            {usuario?.coordinador && (
              <p className="text-sm text-blue-600">{usuario.coordinador.departamento}</p>
            )}
          </div>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Estudiantes</dt>
                    <dd className="text-lg font-medium text-gray-900">{resumenGeneral.totalEstudiantes}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Alertas de Riesgo Alto</dt>
                    <dd className="text-lg font-medium text-gray-900">{resumenGeneral.alertasRiesgoAlto}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tasa de Respuesta</dt>
                    <dd className="text-lg font-medium text-gray-900">{resumenGeneral.tasaRespuestaSemanal}%</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Promedio General</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      E:{resumenGeneral.promedioEstres.toFixed(1)} B:{resumenGeneral.promedioBurnout.toFixed(1)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Distribución de riesgo */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Distribución por Nivel de Riesgo</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Riesgo Bajo</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {resumenGeneral.distribucionRiesgo.bajo || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Riesgo Medio</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {resumenGeneral.distribucionRiesgo.medio || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Riesgo Alto</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {resumenGeneral.distribucionRiesgo.alto || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Estudiantes de riesgo alto */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Estudiantes de Riesgo Alto</h2>
              </div>
              
              {estudiantesRiesgoAlto.length > 0 ? (
                <div className="space-y-3">
                  {estudiantesRiesgoAlto.slice(0, 5).map((estudiante) => (
                    <div key={estudiante.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{estudiante.usuario.nombreCompleto}</p>
                        <p className="text-sm text-gray-600">{estudiante.carrera}</p>
                        <p className="text-xs text-gray-500">
                          E:{estudiante.nivelEstresActual}/10 • B:{estudiante.nivelBurnout}/10
                        </p>
                      </div>
                      <Link
                        to={`${ROUTES.COORDINATOR_STUDENTS}?studentId=${estudiante.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  ))}
                  
                  <div className="pt-3">
                    <Link 
                      to={ROUTES.COORDINATOR_STUDENTS}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver todos los estudiantes →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay estudiantes con riesgo alto actualmente
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas recientes */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Alertas Recientes</h2>
                  <Link 
                    to={ROUTES.COORDINATOR_ALERTS}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ver todas
                  </Link>
                </div>
              </div>
              
              {alertasRecientes.length > 0 ? (
                <div className="space-y-3">
                  {alertasRecientes.slice(0, 5).map((alerta) => (
                    <div key={alerta.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        alerta.severidad === 'ALTO' ? 'bg-red-500' :
                        alerta.severidad === 'MEDIO' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alerta.estudiante.nombre}
                        </p>
                        <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getTiempoTranscurrido(alerta.fechaCreacion)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay alertas recientes
                </p>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
              </div>
              
              <div className="space-y-3">
                <Link
                  to={ROUTES.COORDINATOR_STUDENTS}
                  className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Gestionar Estudiantes</h3>
                      <p className="text-sm text-gray-600">Ver lista completa y filtrar por riesgo</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to={ROUTES.COORDINATOR_ALERTS}
                  className="block p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🚨</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Revisar Alertas</h3>
                      <p className="text-sm text-gray-600">
                        {resumenGeneral.alertasRiesgoAlto} alertas de riesgo alto
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to={ROUTES.COORDINATOR_REPORTS}
                  className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📋</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Generar Reportes</h3>
                      <p className="text-sm text-gray-600">Estadísticas y análisis detallado</p>
                    </div>
                  </div>
                </Link>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Estadísticas Rápidas</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>• {tendenciasSemanales.length} semanas de datos</p>
                        <p>• Promedio estrés: {resumenGeneral.promedioEstres.toFixed(1)}/10</p>
                        <p>• Promedio burnout: {resumenGeneral.promedioBurnout.toFixed(1)}/10</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorDashboard;