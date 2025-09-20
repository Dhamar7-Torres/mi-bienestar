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
      'Manejo del Estrés': 'bg-red-50 text-red-700 border-red-200',
      'Productividad': 'bg-blue-50 text-blue-700 border-blue-200',
      'Bienestar Mental': 'bg-green-50 text-green-700 border-green-200',
      'Relajación': 'bg-purple-50 text-purple-700 border-purple-200',
      'default': 'bg-gray-50 text-gray-700 border-gray-200'
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar recursos</h2>
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

  const recursosMostrar = recursosFiltrados();

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Recursos Educativos 📚
            </h1>
            <p className="mt-2 text-gray-600">
              Herramientas y contenido para mejorar tu bienestar académico y personal
            </p>
          </div>

          {/* Filtros */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="input-field min-w-40"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Recurso
                  </label>
                  <select
                    id="tipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="input-field min-w-40"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="video">Videos</option>
                    <option value="articulo">Artículos</option>
                    <option value="ejercicio">Ejercicios</option>
                    <option value="tecnica">Técnicas</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
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
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getColorCategoria(categoria)} mr-3`}>
                      {categoria}
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      ({items.length} recurso{items.length !== 1 ? 's' : ''})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((recurso) => (
                      <div key={recurso.id} className="card hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="text-3xl">
                            {getIconoTipo(recurso.tipoRecurso)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {recurso.titulo}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                recurso.tipoRecurso === 'VIDEO' ? 'bg-red-100 text-red-700' :
                                recurso.tipoRecurso === 'ARTICULO' ? 'bg-blue-100 text-blue-700' :
                                recurso.tipoRecurso === 'EJERCICIO' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {recurso.tipoRecurso.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {recurso.descripcion && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {recurso.descripcion}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {recurso.urlContenido ? (
                            <button 
                              onClick={() => window.open(recurso.urlContenido, '_blank')}
                              className="btn-primary text-sm"
                            >
                              {recurso.tipoRecurso === 'VIDEO' ? 'Ver Video' :
                               recurso.tipoRecurso === 'ARTICULO' ? 'Leer Artículo' :
                               recurso.tipoRecurso === 'EJERCICIO' ? 'Ver Ejercicio' :
                               'Ver Técnica'}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">Próximamente disponible</span>
                          )}

                          <button className="text-gray-400 hover:text-gray-600 transition-colors">
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
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron recursos
              </h3>
              <p className="text-gray-600">
                Intenta cambiar los filtros para ver más contenido
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-12 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💡 ¿Cómo usar estos recursos?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📺 Videos</h3>
                <p className="text-gray-600 text-sm">
                  Contenido visual para aprender técnicas de relajación, manejo del tiempo y bienestar mental.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📄 Artículos</h3>
                <p className="text-gray-600 text-sm">
                  Guías detalladas con información basada en evidencia sobre temas de salud mental estudiantil.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🏃‍♂️ Ejercicios</h3>
                <p className="text-gray-600 text-sm">
                  Actividades prácticas para reducir el estrés, mejorar la concentración y mantener el bienestar.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🧠 Técnicas</h3>
                <p className="text-gray-600 text-sm">
                  Métodos específicos y paso a paso para manejar situaciones de estrés y ansiedad académica.
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-8 card bg-blue-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                ¿Necesitas más ayuda personalizada?
              </h2>
              <p className="text-blue-700 mb-4">
                Nuestro equipo de bienestar estudiantil está aquí para apoyarte
              </p>
              <button className="btn-primary bg-blue-600 hover:bg-blue-700">
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