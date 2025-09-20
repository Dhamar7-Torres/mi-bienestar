import { useState, useEffect } from 'react';
import { evaluationService } from '../services/evaluationService';

export const useEvaluations = (studentId) => {
  const [evaluations, setEvaluations] = useState([]);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadEvaluations();
    }
  }, [studentId]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [evaluationsResponse, lastEvaluationResponse] = await Promise.all([
        evaluationService.getByStudent(studentId),
        evaluationService.getLastByStudent(studentId).catch(() => ({ data: null }))
      ]);

      setEvaluations(evaluationsResponse.data);
      setLastEvaluation(lastEvaluationResponse.data);
    } catch (err) {
      console.error('Error loading evaluations:', err);
      setError(err.message || 'Error al cargar evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const addEvaluation = (newEvaluation) => {
    setEvaluations(prev => [newEvaluation, ...prev]);
    setLastEvaluation(newEvaluation);
  };

  return {
    evaluations,
    lastEvaluation,
    loading,
    error,
    reload: loadEvaluations,
    addEvaluation
  };
};