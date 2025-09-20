import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { RISK_LEVELS } from '../../utils/constants';
import { Search, Mail, User, AlertTriangle } from 'lucide-react';

export const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAll();
      setStudents(response.data);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.carrera.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = selectedRiskLevel === 'all' || student.nivel_riesgo_actual === selectedRiskLevel;
    
    return matchesSearch && matchesRisk;
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Lista de Estudiantes</h2>
          <p className="text-gray-600 mt-1">
            Monitoreo y seguimiento de {students.length} estudiantes activos
          </p>
        </div>
        <Button variant="primary">
          Agregar Estudiante
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos los niveles</option>
                <option value="ALTO">Riesgo Alto</option>
                <option value="MEDIO">Riesgo Medio</option>
                <option value="BAJO">Riesgo Bajo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Estudiantes ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrera
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Promedio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel de Riesgo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alertas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const riskLevel = student.nivel_riesgo_actual || 'BAJO';
                  const riskInfo = RISK_LEVELS[riskLevel];
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.nombre}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.carrera}</div>
                        <div className="text-sm text-gray-500">Semestre {student.semestre}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.total_evaluaciones || 0}
                        </div>
                        <div className="text-sm text-gray-500">completadas</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.ultimo_promedio ? student.ultimo_promedio.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">sobre 10</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskInfo.bgColor} ${riskInfo.textColor}`}>
                          {riskInfo.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.alertas_pendientes > 0 ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-danger-500 mr-1" />
                            <span className="text-sm font-medium text-danger-600">
                              {student.alertas_pendientes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin alertas</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button size="sm" variant="outline">
                          Ver Detalles
                        </Button>
                        {student.alertas_pendientes > 0 && (
                          <Button size="sm" variant="danger">
                            Ver Alertas
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron estudiantes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedRiskLevel !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay estudiantes registrados en el sistema'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(RISK_LEVELS).map(([level, info]) => {
          const count = students.filter(s => s.nivel_riesgo_actual === level).length;
          return (
            <Card key={level} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${info.bgColor} mb-3`}>
                    <span className={`text-lg font-bold ${info.textColor}`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Riesgo {info.label}</p>
                  <p className="text-xs text-gray-500">
                    {students.length > 0 ? Math.round((count / students.length) * 100) : 0}% del total
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};