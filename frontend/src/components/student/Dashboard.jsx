import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { evaluationService } from '../../services/evaluationService';
import { CATEGORIES, RISK_LEVELS } from '../../utils/constants';
import { formatScore } from '../../utils/riskCalculations';

export const Dashboard = ({ studentId = 1 }) => {
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLastEvaluation();
  }, [studentId]);

  const loadLastEvaluation = async () => {
    try {
      setLoading(true);
      const response = await evaluationService.getLastByStudent(studentId);
      setLastEvaluation(response.data);
    } catch (err) {
      console.error('Error loading evaluation:', err);
      setError('No se encontraron evaluaciones previas');
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

  if (error && !lastEvaluation) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <p className="text-lg mb-4">¡Bienvenido a Mi Bienestar DACYTI!</p>
              <p>Aún no has completado ninguna evaluación.</p>
              <p className="mt-2">Completa tu primera evaluación semanal para ver tu dashboard personalizado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scores = lastEvaluation?.scores || {};
  const riskLevel = scores.nivel_riesgo || 'BAJO';
  const riskInfo = RISK_LEVELS[riskLevel];

  return (
    <div className="p-6 space-y-6">
      {/* Header con nivel de riesgo general */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Dashboard de Bienestar</h2>
        <div className={`inline-flex items-center px-4 py-2 rounded-lg ${riskInfo.bgColor}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${riskInfo.textColor.replace('text-', 'bg-')}`}></div>
          <span className={`font-medium ${riskInfo.textColor}`}>
            Nivel de Riesgo: {riskInfo.label}
          </span>
        </div>
        <p className="text-gray-600 mt-2">{riskInfo.description}</p>
      </div>

      {/* Puntajes por categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(CATEGORIES).map(([key, category]) => {
          const score = scores[key] || 0;
          return (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardHeader className={`${category.bgColor} border-b-0`}>
                <CardTitle className={`text-lg ${category.color} flex items-center`}>
                  <span className="mr-2 text-2xl">{category.icon}</span>
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatScore(score)}
                  </span>
                  <span className="text-gray-500 text-lg">/10</span>
                </div>
                <ProgressBar 
                  value={score} 
                  max={10} 
                  showValue={false}
                  color="primary"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de tendencia */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Puntajes</CardTitle>
          <p className="text-sm text-gray-600">
            Última evaluación: {lastEvaluation ? new Date(lastEvaluation.fecha_evaluacion).toLocaleDateString() : 'N/A'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Completa más evaluaciones para ver tu progreso</p>
              <p className="text-sm mt-2">Los gráficos aparecerán después de tu segunda evaluación</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {scores.promedio_general ? formatScore(scores.promedio_general) : '0.0'}
              </div>
              <p className="text-sm text-gray-600">Promedio General</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1</div>
              <p className="text-sm text-gray-600">Evaluaciones Completadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {lastEvaluation?.tiempo_completado || 0}min
              </div>
              <p className="text-sm text-gray-600">Tiempo Última Evaluación</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};