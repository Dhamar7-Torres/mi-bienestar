import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { resourceService } from '../../services/resourceService';
import { RESOURCE_TYPES, CATEGORIES } from '../../utils/constants';
import { ExternalLink, Clock, Filter } from 'lucide-react';

export const Resources = ({ studentId = 1 }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [studentScores, setStudentScores] = useState(null);

  useEffect(() => {
    loadPersonalizedResources();
  }, [studentId]);

  const loadPersonalizedResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getPersonalized(studentId);
      setResources(response.data);
      setStudentScores(response.studentScores);
    } catch (err) {
      console.error('Error loading resources:', err);
      // Fallback: load general resources
      try {
        const generalResponse = await resourceService.getAll({ categoria: 'general' });
        setResources(generalResponse.data);
      } catch (generalErr) {
        console.error('Error loading general resources:', generalErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const categoryMatch = selectedCategory === 'all' || resource.categoria === selectedCategory;
    const typeMatch = selectedType === 'all' || resource.tipo === selectedType;
    return categoryMatch && typeMatch;
  });

  const priorityCategories = studentScores ? 
    Object.entries(studentScores)
      .filter(([key, score]) => key !== 'nivel_riesgo' && key !== 'promedio_general' && score >= 6)
      .map(([key]) => key) : [];

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recursos de Apoyo</h2>
          <p className="text-gray-600 mt-1">
            Recursos personalizados basados en tu última evaluación
          </p>
        </div>
      </div>

      {/* Priority Alert */}
      {priorityCategories.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Recursos Recomendados para Ti
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Basado en tu evaluación, te sugerimos especialmente los recursos de:{' '}
                  {priorityCategories.map(cat => CATEGORIES[cat]?.label).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Categoría:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todas</option>
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
                <option value="general">General</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Tipo:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos</option>
                {Object.entries(RESOURCE_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
            
            {(selectedCategory !== 'all' || selectedType !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedType('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No se encontraron recursos con los filtros seleccionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const resourceType = RESOURCE_TYPES[resource.tipo];
            const category = CATEGORIES[resource.categoria] || { label: 'General', color: 'text-gray-600', bgColor: 'bg-gray-50' };
            const isPriority = priorityCategories.includes(resource.categoria);
            
            return (
              <Card 
                key={resource.id} 
                className={`hover:shadow-lg transition-shadow ${isPriority ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <CardHeader className={category.bgColor}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{resourceType.icon}</span>
                      <div>
                        <CardTitle className="text-base leading-tight">
                          {resource.titulo}
                        </CardTitle>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${category.bgColor} ${category.color}`}>
                            {category.label}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${resourceType.color}`}>
                            {resourceType.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isPriority && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Recomendado
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {resource.descripcion}
                  </p>
                  
                  {resource.duracion && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {resource.duracion} minutos
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {new Date(resource.fecha_creacion).toLocaleDateString()}
                    </div>
                    
                    {resource.url ? (
                      <Button
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
                        className="flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        No disponible
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Categories Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(CATEGORIES).map(([key, category]) => {
              const count = resources.filter(r => r.categoria === key).length;
              return (
                <div key={key} className="text-center">
                  <div className={`w-12 h-12 rounded-full ${category.bgColor} flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-xl">{category.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{category.label}</p>
                  <p className="text-xs text-gray-600">{count} recursos</p>
                </div>
              );
            })}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">📝</span>
              </div>
              <p className="text-sm font-medium text-gray-900">General</p>
              <p className="text-xs text-gray-600">
                {resources.filter(r => r.categoria === 'general').length} recursos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};