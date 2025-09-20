import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ROUTES, COLORES_RIESGO } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { EstudianteResumen } from '../../types';

interface StudentsListResponse {
  estudiantes: EstudianteResumen[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
  filtrosAplicados: {
    riesgo?: string;
    carrera?: string;
    busqueda?: string;
  };
}

function StudentsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentsData, setStudentsData] = useState<StudentsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtroRiesgo, setFiltroRiesgo] = useState(searchParams.get('riesgo') || '');
  const [filtroCarrera, setFiltroCarrera] = useState(searchParams.get('carrera') || '');
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
  const [ordenarPor, setOrdenarPor] = useState(searchParams.get('ordenarPor') || 'nombreCompleto');
  const [orden, setOrden] = useState(searchParams.get('orden') || 'asc');
  const [paginaActual, setPaginaActual] = useState(parseInt(searchParams.get('pagina') || '1'));
  
  const limite = 20;

  useEffect(() => {
    fetchStudents();
  }, [filtroRiesgo, filtroCarrera, busqueda, ordenarPor, orden, paginaActual]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      
      // Actualizar URL con los filtros actuales
      const params = new URLSearchParams();
      if (filtroRiesgo) params.set('riesgo', filtroRiesgo);
      if (filtroCarrera) params.set('carrera', filtroCarrera);
      if (busqueda) params.set('busqueda', busqueda);
      if (ordenarPor) params.set('ordenarPor', ordenarPor);
      if (orden) params.set('orden', orden);
      if (paginaActual > 1) params.set('pagina', paginaActual.toString());
      setSearchParams(params);

      const response = await apiService.getStudentsList({
        filtroRiesgo: filtroRiesgo || undefined,
        filtroCarrera: filtroCarrera || undefined,
        busqueda: busqueda || undefined,
        ordenarPor,
        orden,
        pagina: paginaActual,
        limite
      });
      
      if (response.success) {
        setStudentsData(response.data);
      } else {
        setError(response.message || 'Error al cargar la lista de estudiantes');
      }
    } catch (error: any) {
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltroChange = (nuevosFiltros: Partial<typeof filtros>) => {
    if (nuevosFiltros.filtroRiesgo !== undefined) setFiltroRiesgo(nuevosFiltros.filtroRiesgo);
    if (nuevosFiltros.filtroCarrera !== undefined) setFiltroCarrera(nuevosFiltros.filtroCarrera);
    if (nuevosFiltros.busqueda !== undefined) setBusqueda(nuevosFiltros.busqueda);
    if (nuevosFiltros.ordenarPor !== undefined) setOrdenarPor(nuevosFiltros.ordenarPor);
    if (nuevosFiltros.orden !== undefined) setOrden(nuevosFiltros.orden);
    setPaginaActual(1); // Reset página al cambiar filtros
  };

  const filtros = { filtroRiesgo, filtroCarrera, busqueda, ordenarPor, orden };

  const getRiskColor = (nivel: string) => {
    return COLORES_RIESGO[nivel as keyof typeof COLORES_RIESGO] || COLORES_RIESGO.BAJO;
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const limpiarFiltros = () => {
    setFiltroRiesgo('');
    setFiltroCarrera('');
    setBusqueda('');
    setOrdenarPor('nombreCompleto');
    setOrden('asc');
    setPaginaActual(1);
  };

  const exportarDatos = async () => {
    try {
      const response = await apiService.getStudentsList({
        filtroRiesgo: filtroRiesgo || undefined,
        filtroCarrera: filtroCarrera || undefined,
        busqueda: busqueda || undefined,
        formato: 'json'
      });
      
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'estudiantes_export.json';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exportando datos:', error);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando lista de estudiantes..." />
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
              onClick={fetchStudents}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!studentsData) return null;

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Estudiantes 👥
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor y gestiona el bienestar de todos los estudiantes registrados
            </p>
          </div>

          {/* Filtros y controles */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2">
                <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar estudiante
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="busqueda"
                    value={busqueda}
                    onChange={(e) => handleFiltroChange({ busqueda: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Nombre o correo del estudiante..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Filtro por riesgo */}
              <div>
                <label htmlFor="filtroRiesgo" className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de riesgo
                </label>
                <select
                  id="filtroRiesgo"
                  value={filtroRiesgo}
                  onChange={(e) => handleFiltroChange({ filtroRiesgo: e.target.value })}
                  className="input-field"
                >
                  <option value="">Todos los niveles</option>
                  <option value="ALTO">Alto</option>
                  <option value="MEDIO">Medio</option>
                  <option value="BAJO">Bajo</option>
                </select>
              </div>

              {/* Filtro por carrera */}
              <div>
                <label htmlFor="filtroCarrera" className="block text-sm font-medium text-gray-700 mb-1">
                  Carrera
                </label>
                <input
                  type="text"
                  id="filtroCarrera"
                  value={filtroCarrera}
                  onChange={(e) => handleFiltroChange({ filtroCarrera: e.target.value })}
                  className="input-field"
                  placeholder="Filtrar por carrera..."
                />
              </div>
            </div>

            {/* Controles adicionales */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="ordenarPor" className="text-sm font-medium text-gray-700">
                    Ordenar por:
                  </label>
                  <select
                    id="ordenarPor"
                    value={ordenarPor}
                    onChange={(e) => handleFiltroChange({ ordenarPor: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="nombreCompleto">Nombre</option>
                    <option value="carrera">Carrera</option>
                    <option value="estadoRiesgo">Nivel de riesgo</option>
                    <option value="fechaUltimaEvaluacion">Última evaluación</option>
                  </select>
                  <button
                    onClick={() => handleFiltroChange({ orden: orden === 'asc' ? 'desc' : 'asc' })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {orden === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                <button
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {studentsData.paginacion.total} estudiante{studentsData.paginacion.total !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={exportarDatos}
                  className="btn-secondary text-sm"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de estudiantes */}
          {studentsData.estudiantes.length > 0 ? (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carrera
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Riesgo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Niveles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Evaluación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alertas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentsData.estudiantes.map((estudiante) => {
                      const riskColors = getRiskColor(estudiante.estadoRiesgo);
                      return (
                        <tr key={estudiante.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {estudiante.nombreCompleto}
                              </div>
                              <div className="text-sm text-gray-500">
                                {estudiante.correo}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{estudiante.carrera}</div>
                            <div className="text-sm text-gray-500">{estudiante.semestre}° Sem</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${riskColors.bg} ${riskColors.text}`}>
                              {estudiante.estadoRiesgo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>E: {estudiante.nivelEstres}/10</div>
                            <div>B: {estudiante.nivelBurnout}/10</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatearFecha(estudiante.ultimaEvaluacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {estudiante.alertasActivas > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {estudiante.alertasActivas} activa{estudiante.alertasActivas > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin alertas</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Link
                              to={`${ROUTES.COORDINATOR_STUDENTS}/${estudiante.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver detalles
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {studentsData.paginacion.totalPaginas > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Mostrando {((studentsData.paginacion.pagina - 1) * studentsData.paginacion.limite) + 1} a{' '}
                      {Math.min(studentsData.paginacion.pagina * studentsData.paginacion.limite, studentsData.paginacion.total)} de{' '}
                      {studentsData.paginacion.total} estudiantes
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
                        Página {paginaActual} de {studentsData.paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaActual(Math.min(studentsData.paginacion.totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === studentsData.paginacion.totalPaginas}
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
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron estudiantes
              </h3>
              <p className="text-gray-600">
                Intenta cambiar los filtros de búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentsList;