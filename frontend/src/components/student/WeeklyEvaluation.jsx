import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { evaluationService } from '../../services/evaluationService';
import { CATEGORIES } from '../../utils/constants';
import { CheckCircle, Circle } from 'lucide-react';

export const WeeklyEvaluation = ({ studentId = 1, onEvaluationComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await evaluationService.getQuestions();
      setQuestions(response.data.questions);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitEvaluation = async () => {
    try {
      setSubmitting(true);
      
      const evaluationData = {
        estudiante_id: studentId,
        respuestas: Object.entries(responses).map(([pregunta_id, valor]) => ({
          pregunta_id: parseInt(pregunta_id),
          valor: valor
        })),
        tiempo_completado: Math.round((Date.now() - startTime) / 1000 / 60) // minutos
      };

      const response = await evaluationService.create(evaluationData);
      setCompleted(true);
      
      if (onEvaluationComplete) {
        onEvaluationComplete(response.data);
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError('Error al enviar la evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadQuestions}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-success-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Evaluación Completada!
            </h3>
            <p className="text-gray-600 mb-6">
              Gracias por completar tu evaluación semanal. Los resultados han sido procesados y puedes ver tu dashboard actualizado.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()}>Ver Dashboard</Button>
              <Button variant="outline" onClick={() => setCompleted(false)}>
                Nueva Evaluación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No hay preguntas disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allQuestionsAnswered = questions.every(q => responses[q.id] !== undefined);
  const currentCategory = CATEGORIES[currentQuestion.categoria];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Evaluación Semanal</h2>
          <span className="text-sm text-gray-600">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
        </div>
        <ProgressBar 
          value={progress} 
          max={100} 
          showValue={false}
          className="mb-2"
        />
        <p className="text-sm text-gray-600">{progress.toFixed(0)}% completado</p>
      </div>

      {/* Question Card */}
      <Card className="mb-8">
        <CardHeader className={currentCategory.bgColor}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{currentCategory.icon}</span>
            <div>
              <CardTitle className={currentCategory.color}>
                {currentCategory.label}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Pregunta {currentQuestionIndex + 1}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-8">
            {currentQuestion.texto}
          </h3>
          
          {/* Scale Options */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Nunca (1)</span>
              <span>Muy frecuentemente (10)</span>
            </div>
            
            <div className="grid grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                <button
                  key={value}
                  onClick={() => handleResponse(currentQuestion.id, value)}
                  className={`
                    aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-medium
                    ${responses[currentQuestion.id] === value
                      ? 'border-primary-600 bg-primary-100 text-primary-700'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }
                  `}
                >
                  {value}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Nunca</span>
              <span>Raramente</span>
              <span>A veces</span>
              <span>Frecuentemente</span>
              <span>Muy frecuentemente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Anterior
        </Button>
        
        <div className="flex items-center space-x-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-primary-600'
                  : responses[questions[index].id]
                  ? 'bg-success-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            onClick={submitEvaluation}
            disabled={!allQuestionsAnswered || submitting}
            loading={submitting}
          >
            {submitting ? 'Enviando...' : 'Completar Evaluación'}
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={!responses[currentQuestion.id]}
          >
            Siguiente
          </Button>
        )}
      </div>

      {/* Question Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Progreso por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(CATEGORIES).map(([key, category]) => {
              const categoryQuestions = questions.filter(q => q.categoria === key);
              const answeredInCategory = categoryQuestions.filter(q => responses[q.id]).length;
              
              return (
                <div key={key} className="text-center">
                  <div className={`w-12 h-12 rounded-full ${category.bgColor} flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-xl">{category.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{category.label}</p>
                  <p className="text-xs text-gray-600">
                    {answeredInCategory}/{categoryQuestions.length} completadas
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};