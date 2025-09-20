import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ROUTES, EVALUACION } from '../../constants';
import Navigation from '../Common/Navigation';
import Loading from '../Common/Loading';
import type { PreguntaEvaluacion } from '../../types';

interface PreguntasData {
  categorias: {
    estres: {
      titulo: string;
      descripcion: string;
      preguntas: PreguntaEvaluacion[];
    };
    burnout: {
      titulo: string;
      descripcion: string;
      preguntas: PreguntaEvaluacion[];
    };
  };
  escala: {
    descripcion: string;
    opciones: Array<{
      valor: number;
      etiqueta: string;
      descripcion: string;
    }>;
  };
  instrucciones: string[];
}

function WeeklyEvaluation() {
  const navigate = useNavigate();
  const [preguntasData, setPreguntasData] = useState<PreguntasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: instrucciones, 1: estrés, 2: burnout, 3: resumen
  const [respuestasEstres, setRespuestasEstres] = useState<number[]>([]);
  const [respuestasBurnout, setRespuestasBurnout] = useState<number[]>([]);
  const [tiempoInicio, setTiempoInicio] = useState<number>(Date.now());

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getEvaluationQuestions();
        if (response.success) {
          setPreguntasData(response.data);
          // Inicializar arrays de respuestas
          const estresLength = response.data.categorias.estres.preguntas.length;
          const burnoutLength = response.data.categorias.burnout.preguntas.length;
          setRespuestasEstres(new Array(estresLength).fill(-1));
          setRespuestasBurnout(new Array(burnoutLength).fill(-1));
        } else {
          setError(response.message || 'Error al cargar las preguntas');
        }
      } catch (error: any) {
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleRespuestaEstres = (index: number, valor: number) => {
    const nuevasRespuestas = [...respuestasEstres];
    nuevasRespuestas[index] = valor;
    setRespuestasEstres(nuevasRespuestas);
  };

  const handleRespuestaBurnout = (index: number, valor: number) => {
    const nuevasRespuestas = [...respuestasBurnout];
    nuevasRespuestas[index] = valor;
    setRespuestasBurnout(nuevasRespuestas);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return true; // Instrucciones
      case 1: return respuestasEstres.every(r => r >= 0); // Todas las preguntas de estrés respondidas
      case 2: return respuestasBurnout.every(r => r >= 0); // Todas las preguntas de burnout respondidas
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 0) {
        setTiempoInicio(Date.now());
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const tiempoRespuesta = Math.round((Date.now() - tiempoInicio) / 1000);
      
      const evaluationData = {
        respuestasEstres,
        respuestasBurnout,
        tiempoRespuesta
      };

      const response = await apiService.submitEvaluation(evaluationData);
      
      if (response.success) {
        // Redirigir al dashboard con un mensaje de éxito
        navigate(ROUTES.STUDENT_DASHBOARD, { 
          state: { message: 'Evaluación enviada exitosamente' }
        });
      } else {
        setError(response.message || 'Error al enviar la evaluación');
      }
    } catch (error: any) {
      setError(error.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 3) * 100;
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando evaluación..." />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}
              className="btn-primary mr-4"
            >
              Volver al Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!preguntasData) return null;

  return (
    <div>
      <Navigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Evaluación Semanal de Bienestar 📝
            </h1>
            <p className="mt-2 text-gray-600">
              Esta evaluación te ayudará a identificar tu nivel actual de estrés y burnout
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de la evaluación</span>
              <span>{currentStep}/3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="card">
            {/* Paso 0: Instrucciones */}
            {currentStep === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Instrucciones para la Evaluación
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">¿Qué vamos a evaluar?</h3>
                    <ul className="text-blue-700 space-y-1">
                      <li>• <strong>Estrés académico:</strong> Tu nivel de tensión y presión relacionado con los estudios</li>
                      <li>• <strong>Burnout estudiantil:</strong> Tu nivel de agotamiento emocional y desmotivación</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Instrucciones importantes:</h3>
                    <ul className="space-y-2">
                      {preguntasData.instrucciones.map((instruccion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{instruccion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">Escala de respuestas:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {preguntasData.escala.opciones.map((opcion) => (
                        <div key={opcion.valor} className="text-center p-2 bg-white rounded border">
                          <div className="font-bold text-gray-900">{opcion.valor}</div>
                          <div className="text-sm font-medium text-gray-800">{opcion.etiqueta}</div>
                          <div className="text-xs text-gray-600">{opcion.descripcion}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800">
                      <strong>Tiempo estimado:</strong> 5-10 minutos. 
                      Tómate el tiempo que necesites para responder honestamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 1: Preguntas de Estrés */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {preguntasData.categorias.estres.titulo}
                </h2>
                <p className="text-gray-600 mb-6">
                  {preguntasData.categorias.estres.descripcion}
                </p>

                <div className="space-y-6">
                  {preguntasData.categorias.estres.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {pregunta.texto}
                      </h3>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {preguntasData.escala.opciones.map((opcion) => (
                          <label 
                            key={opcion.valor}
                            className={`cursor-pointer p-3 text-center border rounded-lg transition-colors ${
                              respuestasEstres[index] === opcion.valor
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`estres-${index}`}
                              value={opcion.valor}
                              checked={respuestasEstres[index] === opcion.valor}
                              onChange={() => handleRespuestaEstres(index, opcion.valor)}
                              className="sr-only"
                            />
                            <div className="font-bold text-gray-900">{opcion.valor}</div>
                            <div className="text-xs text-gray-600">{opcion.etiqueta}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 2: Preguntas de Burnout */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {preguntasData.categorias.burnout.titulo}
                </h2>
                <p className="text-gray-600 mb-6">
                  {preguntasData.categorias.burnout.descripcion}
                </p>

                <div className="space-y-6">
                  {preguntasData.categorias.burnout.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {pregunta.texto}
                      </h3>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {preguntasData.escala.opciones.map((opcion) => (
                          <label 
                            key={opcion.valor}
                            className={`cursor-pointer p-3 text-center border rounded-lg transition-colors ${
                              respuestasBurnout[index] === opcion.valor
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`burnout-${index}`}
                              value={opcion.valor}
                              checked={respuestasBurnout[index] === opcion.valor}
                              onChange={() => handleRespuestaBurnout(index, opcion.valor)}
                              className="sr-only"
                            />
                            <div className="font-bold text-gray-900">{opcion.valor}</div>
                            <div className="text-xs text-gray-600">{opcion.etiqueta}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 3: Resumen antes de enviar */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Resumen de tu Evaluación
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-3">Estrés Académico</h3>
                      <div className="text-sm text-red-700">
                        <p><strong>Respuestas completadas:</strong> {respuestasEstres.length}</p>
                        <p><strong>Promedio:</strong> {(respuestasEstres.reduce((a, b) => a + b, 0) / respuestasEstres.length).toFixed(1)}/4</p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-800 mb-3">Burnout Estudiantil</h3>
                      <div className="text-sm text-orange-700">
                        <p><strong>Respuestas completadas:</strong> {respuestasBurnout.length}</p>
                        <p><strong>Promedio:</strong> {(respuestasBurnout.reduce((a, b) => a + b, 0) / respuestasBurnout.length).toFixed(1)}/4</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">¿Qué sucede después?</h3>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Analizaremos tus respuestas para calcular tu nivel de riesgo</li>
                      <li>• Recibirás recomendaciones personalizadas en tu dashboard</li>
                      <li>• Si detectamos riesgo alto, se generará una alerta para el equipo de apoyo</li>
                      <li>• Podrás ver tu progreso en evaluaciones futuras</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800 text-center">
                      <strong>¡Gracias por tu honestidad!</strong> 
                      Tu bienestar es importante para nosotros.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={currentStep === 0 ? () => navigate(ROUTES.STUDENT_DASHBOARD) : handlePrevious}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                {currentStep === 0 ? 'Cancelar' : 'Anterior'}
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === 0 ? 'Comenzar Evaluación' : 'Siguiente'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="spinner h-4 w-4 mr-2" />
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Evaluación'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyEvaluation;