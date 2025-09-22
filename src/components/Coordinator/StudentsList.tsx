import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Filtros - obtener valores iniciales de URL
  const [filtroRiesgo, setFiltroRiesgo] = useState(searchParams.get('riesgo') || '');
  const [filtroCarrera, setFiltroCarrera] = useState(searchParams.get('carrera') || '');
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
  const [paginaActual, setPaginaActual] = useState(parseInt(searchParams.get('pagina') || '1'));
  
  // Estado para debounce de búsqueda y carrera
  const [busquedaDebounced, setBusquedaDebounced] = useState(busqueda);
  const [filtroCarreraDebounced, setFiltroCarreraDebounced] = useState(filtroCarrera);
  
  const limite = 20;

  // Función para refrescar manualmente (para el botón de reintentar)
  const refrescarDatos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getStudentsList({
        filtroRiesgo: filtroRiesgo || undefined,
        filtroCarrera: filtroCarrera || undefined,
        busqueda: busquedaDebounced || undefined,
        pagina: paginaActual,
        limite
      });
      
      if (response.success) {
        let estudiantes = [...response.data.estudiantes];
        
        // Aplicar ordenamiento combinado: filtro de riesgo + búsqueda
        if (filtroRiesgo || (busquedaDebounced && busquedaDebounced.trim())) {
          const termino = busquedaDebounced ? busquedaDebounced.toLowerCase().trim() : '';
          
          estudiantes.sort((a, b) => {
            // PRIMERA PRIORIDAD: Filtro de riesgo
            if (filtroRiesgo) {
              const aCoincideRiesgo = a.estadoRiesgo === filtroRiesgo;
              const bCoincideRiesgo = b.estadoRiesgo === filtroRiesgo;
              
              // Si uno coincide con el filtro de riesgo y el otro no, el que coincide va primero
              if (aCoincideRiesgo && !bCoincideRiesgo) return -1;
              if (bCoincideRiesgo && !aCoincideRiesgo) return 1;
            }
            
            // SEGUNDA PRIORIDAD: Búsqueda por nombre/correo (solo si hay búsqueda activa)
            if (termino) {
              const nombreA = (a.nombreCompleto || '').toLowerCase();
              const nombreB = (b.nombreCompleto || '').toLowerCase();
              const correoA = (a.correo || '').toLowerCase();
              const correoB = (b.correo || '').toLowerCase();
              
              // Máxima prioridad: nombre empieza con el término
              const aPrimeraCoincidencia = nombreA.startsWith(termino);
              const bPrimeraCoincidencia = nombreB.startsWith(termino);
              
              if (aPrimeraCoincidencia && !bPrimeraCoincidencia) return -1;
              if (bPrimeraCoincidencia && !aPrimeraCoincidencia) return 1;
              
              // Segunda prioridad: nombre contiene el término
              const aContieneNombre = nombreA.includes(termino);
              const bContieneNombre = nombreB.includes(termino);
              
              if (aContieneNombre && !bContieneNombre) return -1;
              if (bContieneNombre && !aContieneNombre) return 1;
              
              // Tercera prioridad: correo contiene el término
              const aContieneCorreo = correoA.includes(termino);
              const bContieneCorreo = correoB.includes(termino);
              
              if (aContieneCorreo && !bContieneCorreo) return -1;
              if (bContieneCorreo && !aContieneCorreo) return 1;
            }
            
            // ORDEN FINAL: Alfabético por nombre
            const nombreA = (a.nombreCompleto || '').toLowerCase();
            const nombreB = (b.nombreCompleto || '').toLowerCase();
            return nombreA.localeCompare(nombreB);
          });
        }
        
        setStudentsData({
          ...response.data,
          estudiantes
        });
      } else {
        setError(response.message || 'Error al cargar la lista de estudiantes');
      }
    } catch (error: any) {
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Debounce para el filtro de carrera
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltroCarreraDebounced(filtroCarrera);
    }, 300); // Menos delay para carrera
    return () => clearTimeout(timer);
  }, [filtroCarrera]);

  // Effect SOLO para fetch cuando terminan los debounces
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiService.getStudentsList({
          filtroRiesgo: filtroRiesgo || undefined,
          filtroCarrera: filtroCarreraDebounced || undefined, // Usar versión debounced
          busqueda: busquedaDebounced || undefined,
          pagina: paginaActual,
          limite
        });
        
        if (response.success) {
          let estudiantes = [...response.data.estudiantes];
          
          // Aplicar ordenamiento combinado
          if (filtroRiesgo || filtroCarreraDebounced || busquedaDebounced) {
            const terminoBusqueda = busquedaDebounced ? busquedaDebounced.toLowerCase().trim() : '';
            const terminoCarrera = filtroCarreraDebounced ? filtroCarreraDebounced.toLowerCase().trim() : '';
            
            estudiantes.sort((a, b) => {
              // PRIMERA PRIORIDAD: Filtro de riesgo
              if (filtroRiesgo) {
                const aCoincideRiesgo = a.estadoRiesgo === filtroRiesgo;
                const bCoincideRiesgo = b.estadoRiesgo === filtroRiesgo;
                
                if (aCoincideRiesgo && !bCoincideRiesgo) return -1;
                if (bCoincideRiesgo && !aCoincideRiesgo) return 1;
              }
              
              // SEGUNDA PRIORIDAD: Filtro de carrera
              if (terminoCarrera) {
                const carreraA = (a.carrera || '').toLowerCase();
                const carreraB = (b.carrera || '').toLowerCase();
                
                const aEmpiezaCarrera = carreraA.startsWith(terminoCarrera);
                const bEmpiezaCarrera = carreraB.startsWith(terminoCarrera);
                
                if (aEmpiezaCarrera && !bEmpiezaCarrera) return -1;
                if (bEmpiezaCarrera && !aEmpiezaCarrera) return 1;
                
                const aContieneCarrera = carreraA.includes(terminoCarrera);
                const bContieneCarrera = carreraB.includes(terminoCarrera);
                
                if (aContieneCarrera && !bContieneCarrera) return -1;
                if (bContieneCarrera && !aContieneCarrera) return 1;
              }
              
              // TERCERA PRIORIDAD: Búsqueda por nombre/correo
              if (terminoBusqueda) {
                const nombreA = (a.nombreCompleto || '').toLowerCase();
                const nombreB = (b.nombreCompleto || '').toLowerCase();
                const correoA = (a.correo || '').toLowerCase();
                const correoB = (b.correo || '').toLowerCase();
                
                const aPrimeraCoincidencia = nombreA.startsWith(terminoBusqueda);
                const bPrimeraCoincidencia = nombreB.startsWith(terminoBusqueda);
                
                if (aPrimeraCoincidencia && !bPrimeraCoincidencia) return -1;
                if (bPrimeraCoincidencia && !aPrimeraCoincidencia) return 1;
                
                const aContieneNombre = nombreA.includes(terminoBusqueda);
                const bContieneNombre = nombreB.includes(terminoBusqueda);
                
                if (aContieneNombre && !bContieneNombre) return -1;
                if (bContieneNombre && !aContieneNombre) return 1;
                
                const aContieneCorreo = correoA.includes(terminoBusqueda);
                const bContieneCorreo = correoB.includes(terminoBusqueda);
                
                if (aContieneCorreo && !bContieneCorreo) return -1;
                if (bContieneCorreo && !aContieneCorreo) return 1;
              }
              
              // ORDEN FINAL: Alfabético por nombre
              const nombreA = (a.nombreCompleto || '').toLowerCase();
              const nombreB = (b.nombreCompleto || '').toLowerCase();
              return nombreA.localeCompare(nombreB);
            });
          }
          
          setStudentsData({
            ...response.data,
            estudiantes
          });
        } else {
          setError(response.message || 'Error al cargar la lista de estudiantes');
        }
      } catch (error: any) {
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filtroRiesgo, filtroCarreraDebounced, busquedaDebounced, paginaActual]); // SOLO versiones debounced

  // Handlers para los filtros
  const handleFiltroRiesgoChange = (value: string) => {
    setFiltroRiesgo(value);
    setPaginaActual(1); // Reset página al cambiar filtro
  };

  const handleFiltroCarreraChange = (value: string) => {
    setFiltroCarrera(value);
    setPaginaActual(1); // Reset página al cambiar filtro
  };

  const handleBusquedaChange = (value: string) => {
    setBusqueda(value);
    setPaginaActual(1); // Reset página al cambiar búsqueda
  };

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
    setFiltroCarreraDebounced('');
    setBusqueda('');
    setBusquedaDebounced('');
    setPaginaActual(1);
  };

  const exportarDatos = async () => {
    try {
      const response = await apiService.getStudentsList({
        filtroRiesgo: filtroRiesgo || undefined,
        filtroCarrera: filtroCarreraDebounced || undefined,
        busqueda: busquedaDebounced || undefined,
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
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-teal-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-200 opacity-20 blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Error al cargar</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={refrescarDatos}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
              Gestión de Estudiantes
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Monitor y gestiona el bienestar de todos los estudiantes registrados
            </p>
          </div>

          {/* Filtros y controles - CORREGIDOS */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2">
                <label htmlFor="busqueda" className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar estudiante
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="busqueda"
                    value={busqueda}
                    onChange={(e) => handleBusquedaChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-gray-50"
                    placeholder="Nombre o correo del estudiante..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {/* Indicador de búsqueda activa */}
                  {busqueda !== busquedaDebounced && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtro por riesgo */}
              <div>
                <label htmlFor="filtroRiesgo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nivel de riesgo
                </label>
                <select
                  id="filtroRiesgo"
                  value={filtroRiesgo}
                  onChange={(e) => handleFiltroRiesgoChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-gray-50"
                >
                  <option value="">Todos los niveles</option>
                  <option value="ALTO">Alto</option>
                  <option value="MEDIO">Medio</option>
                  <option value="BAJO">Bajo</option>
                </select>
              </div>

              {/* Filtro por carrera */}
              <div>
                <label htmlFor="filtroCarrera" className="block text-sm font-semibold text-gray-700 mb-2">
                  Carrera
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="filtroCarrera"
                    value={filtroCarrera}
                    onChange={(e) => handleFiltroCarreraChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-gray-50"
                    placeholder="Filtrar por carrera..."
                  />
                  {/* Indicador de filtrado activo */}
                  {filtroCarrera !== filtroCarreraDebounced && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controles adicionales */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pt-4 border-t border-white/30">
              <div className="flex items-center space-x-4">
                <button
                  onClick={limpiarFiltros}
                  className="text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 text-sm font-semibold transition-all duration-200"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-medium">
                  {studentsData.paginacion.total} estudiante{studentsData.paginacion.total !== 1 ? 's' : ''}
                  {(filtroRiesgo || filtroCarreraDebounced || busquedaDebounced) && ' encontrados'}
                </span>
                <button
                  onClick={exportarDatos}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white/70 border-2 border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Exportar
                </button>
              </div>
            </div>

            {/* Filtros activos */}
            {(filtroRiesgo || filtroCarreraDebounced || busquedaDebounced) && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Filtros activos:</span>
                  
                  {filtroRiesgo && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200">
                      Riesgo: {filtroRiesgo}
                      <button
                        onClick={() => handleFiltroRiesgoChange('')}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {filtroCarreraDebounced && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border border-green-200">
                      Carrera: {filtroCarreraDebounced}
                      <button
                        onClick={() => handleFiltroCarreraChange('')}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {busquedaDebounced && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                      Búsqueda: "{busquedaDebounced}"
                      <button
                        onClick={() => handleBusquedaChange('')}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lista de estudiantes */}
          {studentsData.estudiantes.length > 0 ? (
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/30">
                  <thead className="bg-white/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Carrera
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Riesgo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Niveles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Última Evaluación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Alertas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/30 divide-y divide-white/30">
                    {studentsData.estudiantes.map((estudiante) => {
                      const riskColors = getRiskColor(estudiante.estadoRiesgo);
                      return (
                        <tr key={estudiante.id} className="hover:bg-white/50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {estudiante.nombreCompleto}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">
                                {estudiante.correo}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{estudiante.carrera}</div>
                            <div className="text-sm text-gray-600 font-medium">{estudiante.semestre}° Sem</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${riskColors.bg} ${riskColors.text} shadow-sm`}>
                              {estudiante.estadoRiesgo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            <div>E: {estudiante.nivelEstres}/10</div>
                            <div>B: {estudiante.nivelBurnout}/10</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {formatearFecha(estudiante.ultimaEvaluacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {estudiante.alertasActivas > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-sm">
                                {estudiante.alertasActivas} activa{estudiante.alertasActivas > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">Sin alertas</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Link
                              to={`${ROUTES.COORDINATOR_STUDENTS}/${estudiante.id}`}
                              className="text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all duration-200"
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
                <div className="bg-white/50 px-6 py-3 border-t border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-medium">
                      Mostrando {((studentsData.paginacion.pagina - 1) * studentsData.paginacion.limite) + 1} a{' '}
                      {Math.min(studentsData.paginacion.pagina * studentsData.paginacion.limite, studentsData.paginacion.total)} de{' '}
                      {studentsData.paginacion.total} estudiantes
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
                        Página {paginaActual} de {studentsData.paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaActual(Math.min(studentsData.paginacion.totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === studentsData.paginacion.totalPaginas}
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
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent mb-3">
                  No se encontraron estudiantes
                </h3>
                <p className="text-gray-600 font-medium">
                  {(filtroRiesgo || filtroCarreraDebounced || busquedaDebounced) 
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'No hay estudiantes registrados en el sistema'
                  }
                </p>
                {(filtroRiesgo || filtroCarreraDebounced || busquedaDebounced) && (
                  <button
                    onClick={limpiarFiltros}
                    className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentsList;