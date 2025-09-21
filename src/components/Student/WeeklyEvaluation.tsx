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
        setError(null);
        
        console.log('🔄 Cargando preguntas de evaluación...');
        const response = await apiService.getEvaluationQuestions();
        
        if (response.success && response.data) {
          // Validar estructura de datos
          const data = response.data;
          if (data.categorias && data.categorias.estres && data.categorias.burnout) {
            setPreguntasData(data);
            // Inicializar arrays de respuestas con -1 (no respondida)
            const estresLength = data.categorias.estres.preguntas?.length || 0;
            const burnoutLength = data.categorias.burnout.preguntas?.length || 0;
            setRespuestasEstres(new Array(estresLength).fill(-1));
            setRespuestasBurnout(new Array(burnoutLength).fill(-1));
            
            console.log(`✅ Preguntas cargadas: ${estresLength} estrés, ${burnoutLength} burnout`);
          } else {
            console.error('❌ Estructura de preguntas inválida:', data);
            setError('Estructura de preguntas inválida');
          }
        } else {
          console.error('❌ Error en respuesta del servidor:', response);
          setError(response.message || 'Error al cargar las preguntas');
        }
      } catch (error: any) {
        console.error('❌ Error fetching questions:', error);
        setError(error.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // ===== FUNCIONES AUXILIARES MEJORADAS =====

  // Función auxiliar para validar que la evaluación esté completa
  const validarEvaluacionCompleta = (): boolean => {
    const estresCompletas = respuestasEstres.every(r => r >= 0 && r <= 4);
    const burnoutCompletas = respuestasBurnout.every(r => r >= 0 && r <= 4);
    const tieneRespuestas = respuestasEstres.length > 0 && respuestasBurnout.length > 0;
    
    const esValida = estresCompletas && burnoutCompletas && tieneRespuestas;
    
    if (!esValida) {
      console.log('❌ Validación fallida:', {
        estresCompletas,
        burnoutCompletas,
        tieneRespuestas,
        respuestasEstres,
        respuestasBurnout
      });
    }
    
    return esValida;
  };

  // Función para verificar si se puede avanzar al siguiente paso
  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 0: 
        return true; // Instrucciones - siempre se puede avanzar
      case 1: 
        const estresCompleto = respuestasEstres.every(r => r >= 0);
        console.log(`📊 Paso 1 - Estrés completo: ${estresCompleto}`, respuestasEstres);
        return estresCompleto;
      case 2: 
        const burnoutCompleto = respuestasBurnout.every(r => r >= 0);
        console.log(`📊 Paso 2 - Burnout completo: ${burnoutCompleto}`, respuestasBurnout);
        return burnoutCompleto;
      case 3: 
        // Para el paso final, verificar que ambas categorías estén completas
        const evaluacionCompleta = validarEvaluacionCompleta();
        console.log(`📊 Paso 3 - Evaluación completa: ${evaluacionCompleta}`);
        return evaluacionCompleta;
      default: 
        return false;
    }
  };

  // Función para obtener el progreso detallado
  const getProgressDetails = () => {
    const estresCompletadas = respuestasEstres.filter(r => r >= 0).length;
    const burnoutCompletadas = respuestasBurnout.filter(r => r >= 0).length;
    const totalEstres = respuestasEstres.length;
    const totalBurnout = respuestasBurnout.length;
    
    return {
      estresCompletadas,
      burnoutCompletadas,
      totalEstres,
      totalBurnout,
      porcentajeEstres: totalEstres > 0 ? (estresCompletadas / totalEstres) * 100 : 0,
      porcentajeBurnout: totalBurnout > 0 ? (burnoutCompletadas / totalBurnout) * 100 : 0
    };
  };

  // ===== HANDLERS DE EVENTOS =====

  const handleRespuestaEstres = (index: number, valor: number) => {
    if (index >= 0 && index < respuestasEstres.length && valor >= 0 && valor <= 4) {
      const nuevasRespuestas = [...respuestasEstres];
      nuevasRespuestas[index] = valor;
      setRespuestasEstres(nuevasRespuestas);
      console.log(`📝 Respuesta estrés ${index + 1}: ${valor}`);
      
      // Limpiar error si existía
      if (error) {
        setError(null);
      }
    }
  };

  const handleRespuestaBurnout = (index: number, valor: number) => {
    if (index >= 0 && index < respuestasBurnout.length && valor >= 0 && valor <= 4) {
      const nuevasRespuestas = [...respuestasBurnout];
      nuevasRespuestas[index] = valor;
      setRespuestasBurnout(nuevasRespuestas);
      console.log(`📝 Respuesta burnout ${index + 1}: ${valor}`);
      
      // Limpiar error si existía
      if (error) {
        setError(null);
      }
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 0) {
        setTiempoInicio(Date.now());
        console.log('⏱️ Iniciando cronómetro de evaluación');
      }
      console.log(`➡️ Avanzando al paso ${currentStep + 1}`);
      
      // Limpiar errores al avanzar
      if (error) {
        setError(null);
      }
    } else {
      console.log('❌ No se puede avanzar:', { currentStep, canProceed: canProceedToNext() });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      console.log(`⬅️ Retrocediendo al paso ${currentStep - 1}`);
      
      // Limpiar errores al retroceder
      if (error) {
        setError(null);
      }
    }
  };

  // Función mejorada para calcular promedio excluyendo valores -1
  const calcularPromedio = (respuestas: number[]): number => {
    const respuestasValidas = respuestas.filter(r => r >= 0);
    if (respuestasValidas.length === 0) return 0;
    return respuestasValidas.reduce((a, b) => a + b, 0) / respuestasValidas.length;
  };

  // Función principal para enviar la evaluación
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('🚀 Iniciando envío de evaluación...');
      console.log('Estado actual:', {
        currentStep,
        respuestasEstres,
        respuestasBurnout,
        canProceed: canProceedToNext()
      });
      
      // Validación completa antes de enviar
      if (!validarEvaluacionCompleta()) {
        const mensaje = 'Por favor completa todas las preguntas antes de enviar';
        console.error('❌ Validación fallida:', mensaje);
        setError(mensaje);
        return;
      }

      // Verificar que no haya respuestas inválidas
      const tieneRespuestasInvalidas = 
        respuestasEstres.some(r => r < 0 || r > 4) || 
        respuestasBurnout.some(r => r < 0 || r > 4);
      
      if (tieneRespuestasInvalidas) {
        const mensaje = 'Hay respuestas inválidas. Por favor revisa tus respuestas.';
        console.error('❌ Respuestas inválidas detectadas');
        setError(mensaje);
        return;
      }
      
      const tiempoRespuesta = Math.round((Date.now() - tiempoInicio) / 1000);
      console.log(`⏱️ Tiempo total de respuesta: ${tiempoRespuesta} segundos`);
      
      const evaluationData = {
        respuestasEstres: respuestasEstres,
        respuestasBurnout: respuestasBurnout,
        tiempoRespuesta
      };

      console.log('📤 Enviando evaluación:', evaluationData);

      const response = await apiService.submitEvaluation(evaluationData);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Evaluación enviada exitosamente');
        // Redirigir al dashboard con un mensaje de éxito
        navigate(ROUTES.STUDENT_DASHBOARD, { 
          state: { message: 'Evaluación enviada exitosamente' }
        });
      } else {
        const mensaje = response.message || 'Error al enviar la evaluación';
        console.error('❌ Error del servidor:', mensaje);
        setError(mensaje);
      }
    } catch (error: any) {
      console.error('❌ Error submitting evaluation:', error);
      const mensaje = error.message || 'Error de conexión. Por favor intenta nuevamente.';
      setError(mensaje);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Proceso de envío finalizado');
    }
  };

  // ===== FUNCIONES DE UTILIDAD =====

  const getProgressPercentage = (): number => {
    return (currentStep / 3) * 100;
  };

  const getCompletedQuestionsCount = () => {
    const progressDetails = getProgressDetails();
    return {
      estresCompletadas: progressDetails.estresCompletadas,
      burnoutCompletadas: progressDetails.burnoutCompletadas
    };
  };

  // ===== RENDERIZADO CONDICIONAL =====

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <Loading message="Cargando evaluación..." />
      </div>
    );
  }

  if (error && !preguntasData) {
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

  if (!preguntasData || !preguntasData.categorias) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos no disponibles</h2>
            <p className="text-gray-600 mb-4">No se pudieron cargar las preguntas de evaluación</p>
            <button 
              onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}
              className="btn-primary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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

                  {preguntasData.instrucciones && (
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
                  )}

                  {preguntasData.escala && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">Escala de respuestas:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {preguntasData.escala.opciones?.map((opcion) => (
                          <div key={opcion.valor} className="text-center p-2 bg-white rounded border">
                            <div className="font-bold text-gray-900">{opcion.valor}</div>
                            <div className="text-sm font-medium text-gray-800">{opcion.etiqueta}</div>
                            <div className="text-xs text-gray-600">{opcion.descripcion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
            {currentStep === 1 && preguntasData.categorias.estres && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {preguntasData.categorias.estres.titulo}
                </h2>
                <p className="text-gray-600 mb-6">
                  {preguntasData.categorias.estres.descripcion}
                </p>

                {/* Indicador de progreso para esta sección */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm text-blue-800">
                    <span>Progreso en esta sección:</span>
                    <span>{getCompletedQuestionsCount().estresCompletadas}/{respuestasEstres.length}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {preguntasData.categorias.estres.preguntas?.map((pregunta, index) => (
                    <div key={pregunta.id || index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {pregunta.texto}
                        {respuestasEstres[index] >= 0 && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </h3>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {preguntasData.escala?.opciones?.map((opcion) => (
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
            {currentStep === 2 && preguntasData.categorias.burnout && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {preguntasData.categorias.burnout.titulo}
                </h2>
                <p className="text-gray-600 mb-6">
                  {preguntasData.categorias.burnout.descripcion}
                </p>

                {/* Indicador de progreso para esta sección */}
                <div className="mb-6 p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between text-sm text-orange-800">
                    <span>Progreso en esta sección:</span>
                    <span>{getCompletedQuestionsCount().burnoutCompletadas}/{respuestasBurnout.length}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {preguntasData.categorias.burnout.preguntas?.map((pregunta, index) => (
                    <div key={pregunta.id || index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {pregunta.texto}
                        {respuestasBurnout[index] >= 0 && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </h3>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {preguntasData.escala?.opciones?.map((opcion) => (
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
                        <p><strong>Respuestas completadas:</strong> {getCompletedQuestionsCount().estresCompletadas}/{respuestasEstres.length}</p>
                        <p><strong>Promedio:</strong> {calcularPromedio(respuestasEstres).toFixed(1)}/4</p>
                        <div className="mt-2">
                          <div className="w-full bg-red-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${(calcularPromedio(respuestasEstres) / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-800 mb-3">Burnout Estudiantil</h3>
                      <div className="text-sm text-orange-700">
                        <p><strong>Respuestas completadas:</strong> {getCompletedQuestionsCount().burnoutCompletadas}/{respuestasBurnout.length}</p>
                        <p><strong>Promedio:</strong> {calcularPromedio(respuestasBurnout).toFixed(1)}/4</p>
                        <div className="mt-2">
                          <div className="w-full bg-orange-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${(calcularPromedio(respuestasBurnout) / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
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

                  {/* Indicador de estado de la evaluación */}
                  <div className={`p-4 rounded-lg ${validarEvaluacionCompleta() ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {validarEvaluacionCompleta() ? '✅' : '⚠️'}
                      </span>
                      <div>
                        <p className={`font-semibold ${validarEvaluacionCompleta() ? 'text-green-800' : 'text-yellow-800'}`}>
                          {validarEvaluacionCompleta() 
                            ? 'Evaluación lista para enviar' 
                            : 'Revisa que todas las preguntas estén respondidas'
                          }
                        </p>
                        {!validarEvaluacionCompleta() && (
                          <p className="text-yellow-700 text-sm mt-1">
                            Asegúrate de haber respondido todas las preguntas antes de enviar.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mostrar error si existe */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700">{error}</p>
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
                  title={!canProceedToNext() ? 'Completa todas las preguntas para continuar' : ''}
                >
                  {currentStep === 0 ? 'Comenzar Evaluación' : 'Siguiente'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceedToNext()}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!canProceedToNext() ? 'Completa todas las preguntas para enviar' : ''}
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