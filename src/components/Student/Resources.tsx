import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { RecursosPorCategoria } from '../../types';

function Resources() {
  const [recursos, setRecursos] = useState<RecursosPorCategoria>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getResources();
        if (response.success) {
          setRecursos(response.data.recursos);
        } else {
          setError(response.message || 'Error al cargar los recursos');
        }
      } catch (error: any) {
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categorias = Object.keys(recursos);
  
  const recursosFiltrados = () => {
    let resultado = recursos;
    
    if (filtroCategoria !== 'todas') {
      resultado = { [filtroCategoria]: recursos[filtroCategoria] || [] };
    }
    
    if (filtroTipo !== 'todos') {
      const filtrado: RecursosPorCategoria = {};
      Object.entries(resultado).forEach(([categoria, items]) => {
        const itemsFiltrados = items.filter(item => item.tipoRecurso.toLowerCase() === filtroTipo.toLowerCase());
        if (itemsFiltrados.length > 0) {
          filtrado[categoria] = itemsFiltrados;
        }
      });
      resultado = filtrado;
    }
    
    return resultado;
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'video': return '🎥';
      case 'articulo': return '📄';
      case 'ejercicio': return '🏃‍♂️';
      case 'tecnica': return '🧠';
      default: return '📚';
    }
  };

  const getColorCategoria = (categoria: string) => {
    const colores = {
      'Manejo del Estrés': 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200',
      'Productividad': 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200',
      'Bienestar Mental': 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200',
      'Relajación': 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      'default': 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200'
    };
    return colores[categoria as keyof typeof colores] || colores.default;
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando recursos..." />
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
            <div className="text-red-600 text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Error al cargar recursos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recursosMostrar = recursosFiltrados();

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
              Recursos Educativos 📚
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Herramientas y contenido para mejorar tu bienestar académico y personal
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  <label htmlFor="categoria" className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="min-w-40 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tipo" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Recurso
                  </label>
                  <select
                    id="tipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="min-w-40 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:bg-white/70"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="video">Videos</option>
                    <option value="articulo">Artículos</option>
                    <option value="ejercicio">Ejercicios</option>
                    <option value="tecnica">Técnicas</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600 font-medium">
                {Object.values(recursosMostrar).reduce((total, items) => total + items.length, 0)} recursos encontrados
              </div>
            </div>
          </div>

          {/* Recursos por categoría */}
          {Object.entries(recursosMostrar).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(recursosMostrar).map(([categoria, items]) => (
                <div key={categoria}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border shadow-sm ${getColorCategoria(categoria)} mr-3`}>
                      {categoria}
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      ({items.length} recurso{items.length !== 1 ? 's' : ''})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((recurso) => (
                      <div key={recurso.id} className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 hover:-translate-y-1">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="text-3xl">
                            {getIconoTipo(recurso.tipoRecurso)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {recurso.titulo}
                              </h3>
                              <span className={`px-3 py-1 text-xs rounded-full font-bold shadow-sm ${
                                recurso.tipoRecurso === 'VIDEO' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700' :
                                recurso.tipoRecurso === 'ARTICULO' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700' :
                                recurso.tipoRecurso === 'EJERCICIO' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700' :
                                'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700'
                              }`}>
                                {recurso.tipoRecurso.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {recurso.descripcion && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {recurso.descripcion}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {recurso.urlContenido ? (
                            <button 
                              onClick={() => window.open(recurso.urlContenido, '_blank')}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
                            >
                              {recurso.tipoRecurso === 'VIDEO' ? 'Ver Video' :
                               recurso.tipoRecurso === 'ARTICULO' ? 'Leer Artículo' :
                               recurso.tipoRecurso === 'EJERCICIO' ? 'Ver Ejercicio' :
                               'Ver Técnica'}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">Próximamente disponible</span>
                          )}

                          <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 rounded-lg hover:bg-white/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 inline-block">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent mb-3">
                  No se encontraron recursos
                </h3>
                <p className="text-gray-600 font-medium">
                  Intenta cambiar los filtros para ver más contenido
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-12 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              💡 ¿Cómo usar estos recursos?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📺 Videos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Contenido visual para aprender técnicas de relajación, manejo del tiempo y bienestar mental.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📄 Artículos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Guías detalladas con información basada en evidencia sobre temas de salud mental estudiantil.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🏃‍♂️ Ejercicios</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Actividades prácticas para reducir el estrés, mejorar la concentración y mantener el bienestar.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🧠 Técnicas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Métodos específicos y paso a paso para manejar situaciones de estrés y ansiedad académica.
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                ¿Necesitas más ayuda personalizada?
              </h2>
              <p className="text-blue-700 mb-4 font-medium">
                Nuestro equipo de bienestar estudiantil está aquí para apoyarte
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Contactar Bienestar Estudiantil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;