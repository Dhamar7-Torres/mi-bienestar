import express from 'express';
import { authenticateToken, requireStudent, logActivity } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import RiskCalculator from '../utils/riskCalculator.js';

const router = express.Router();

// Middleware base
router.use(authenticateToken);

const riskCalculator = new RiskCalculator();

// GET /api/evaluations/questions - Obtener preguntas activas para evaluación
router.get('/questions',
  requireStudent,
  logActivity('obtener_preguntas_evaluacion'),
  async (req, res) => {
    try {
      const preguntas = await prisma.preguntaEvaluacion.findMany({
        where: { activa: true },
        orderBy: [
          { categoria: 'asc' },
          { orden: 'asc' }
        ],
        select: {
          id: true,
          textoPregunta: true,
          categoria: true,
          peso: true,
          orden: true
        }
      });

      // Separar por categoría y formatear
      const preguntasEstres = preguntas
        .filter(p => p.categoria === 'ESTRES')
        .map((p, index) => ({
          id: p.id,
          numero: index + 1,
          texto: p.textoPregunta,
          peso: p.peso
        }));

      const preguntasBurnout = preguntas
        .filter(p => p.categoria === 'BURNOUT')
        .map((p, index) => ({
          id: p.id,
          numero: index + 1,
          texto: p.textoPregunta,
          peso: p.peso
        }));

      res.status(200).json({
        success: true,
        data: {
          categorias: {
            estres: {
              titulo: 'Evaluación de Estrés Académico',
              descripcion: 'Responde según tu experiencia en las últimas 2 semanas',
              preguntas: preguntasEstres
            },
            burnout: {
              titulo: 'Evaluación de Agotamiento (Burnout)',
              descripcion: 'Responde según cómo te has sentido en el último mes',
              preguntas: preguntasBurnout
            }
          },
          escala: {
            descripcion: 'Selecciona la opción que mejor describa tu experiencia',
            opciones: [
              { valor: 0, etiqueta: 'Nunca', descripcion: 'No he experimentado esto' },
              { valor: 1, etiqueta: 'Rara vez', descripcion: 'Muy ocasionalmente' },
              { valor: 2, etiqueta: 'A veces', descripcion: 'De vez en cuando' },
              { valor: 3, etiqueta: 'Frecuentemente', descripcion: 'Varias veces por semana' },
              { valor: 4, etiqueta: 'Siempre', descripcion: 'Constantemente o diariamente' }
            ]
          },
          instrucciones: [
            'Lee cada pregunta cuidadosamente',
            'Responde de manera honesta según tu experiencia reciente',
            'No hay respuestas correctas o incorrectas',
            'Tus respuestas son confidenciales'
          ]
        }
      });

    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// POST /api/evaluations/submit - Enviar evaluación
router.post('/submit',
  requireStudent,
  logActivity('enviar_evaluacion'),
  async (req, res) => {
    try {
      const { respuestasEstres, respuestasBurnout, tiempoRespuesta } = req.body;
      const estudianteId = req.user.estudiante.id;

      // Validar respuestas
      if (!respuestasEstres || !respuestasBurnout) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren respuestas para ambas categorías'
        });
      }

      if (!Array.isArray(respuestasEstres) || !Array.isArray(respuestasBurnout)) {
        return res.status(400).json({
          success: false,
          message: 'Las respuestas deben ser arrays'
        });
      }

      // Validar que todas las respuestas estén en rango 0-4
      const todasRespuestas = [...respuestasEstres, ...respuestasBurnout];
      const respuestasValidas = todasRespuestas.every(r => 
        Number.isInteger(r) && r >= 0 && r <= 4
      );

      if (!respuestasValidas) {
        return res.status(400).json({
          success: false,
          message: 'Todas las respuestas deben ser números enteros entre 0 y 4'
        });
      }

      // Verificar límites de evaluación
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const evaluacionesSemana = await prisma.evaluacion.count({
        where: {
          estudianteId,
          fechaEvaluacion: { gte: inicioSemana }
        }
      });

      if (evaluacionesSemana >= 2) {
        const proximaSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000);
        return res.status(429).json({
          success: false,
          message: 'Has alcanzado el límite de 2 evaluaciones por semana',
          proximaEvaluacion: proximaSemana
        });
      }

      // Obtener pesos de preguntas
      const preguntas = await prisma.preguntaEvaluacion.findMany({
        where: { activa: true },
        orderBy: { orden: 'asc' }
      });

      const pesosEstres = preguntas
        .filter(p => p.categoria === 'ESTRES')
        .map(p => p.peso);

      const pesosBurnout = preguntas
        .filter(p => p.categoria === 'BURNOUT')
        .map(p => p.peso);

      // Obtener perfil del estudiante
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        select: { semestre: true, carrera: true }
      });

      // Procesar evaluación
      const resultado = riskCalculator.processEvaluation({
        stressAnswers: respuestasEstres,
        burnoutAnswers: respuestasBurnout,
        stressWeights: pesosEstres,
        burnoutWeights: pesosBurnout,
        studentProfile: estudiante
      });

      // Guardar evaluación
      const evaluacion = await prisma.evaluacion.create({
        data: {
          estudianteId,
          puntajeEstres: resultado.scores.stress,
          puntajeBurnout: resultado.scores.burnout,
          puntajeTotal: resultado.scores.total,
          nivelRiesgo: resultado.riskLevels.overall,
          respuestas: {
            estres: respuestasEstres,
            burnout: respuestasBurnout,
            tiempoRespuesta: tiempoRespuesta || null,
            metadata: resultado.metadata
          }
        }
      });

      // Actualizar estado del estudiante
      await prisma.estudiante.update({
        where: { id: estudianteId },
        data: {
          nivelEstresActual: resultado.scores.stress,
          nivelBurnoutActual: resultado.scores.burnout,
          estadoRiesgo: resultado.riskLevels.overall,
          fechaUltimaEvaluacion: new Date()
        }
      });

      // Generar alerta si es necesario
      const alertInfo = riskCalculator.shouldGenerateAlert(
        resultado.riskLevels.overall,
        resultado.scores.stress,
        resultado.scores.burnout
      );

      let alertaGenerada = null;
      if (alertInfo.needed) {
        alertaGenerada = await prisma.alerta.create({
          data: {
            estudianteId,
            tipoAlerta: alertInfo.type,
            severidad: alertInfo.severity,
            mensaje: alertInfo.message
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Evaluación procesada exitosamente',
        data: {
          evaluacion: {
            id: evaluacion.id,
            fecha: evaluacion.fechaEvaluacion,
            puntajes: resultado.scores,
            nivelesRiesgo: resultado.riskLevels
          },
          analisis: resultado.analysis,
          recomendaciones: resultado.recommendations,
          alertaGenerada: !!alertaGenerada
        }
      });

    } catch (error) {
      console.error('Error procesando evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/evaluations/history - Historial de evaluaciones del estudiante
router.get('/history',
  requireStudent,
  logActivity('ver_historial_evaluaciones'),
  async (req, res) => {
    try {
      const { pagina = 1, limite = 10 } = req.query;
      const estudianteId = req.user.estudiante.id;

      const evaluaciones = await prisma.evaluacion.findMany({
        where: { estudianteId },
        orderBy: { fechaEvaluacion: 'desc' },
        take: parseInt(limite),
        skip: (parseInt(pagina) - 1) * parseInt(limite),
        select: {
          id: true,
          puntajeEstres: true,
          puntajeBurnout: true,
          puntajeTotal: true,
          nivelRiesgo: true,
          fechaEvaluacion: true
        }
      });

      const total = await prisma.evaluacion.count({
        where: { estudianteId }
      });

      res.status(200).json({
        success: true,
        data: {
          evaluaciones,
          paginacion: {
            total,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(total / parseInt(limite))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/evaluations/:evaluationId - Obtener detalles de evaluación específica
router.get('/:evaluationId',
  requireStudent,
  logActivity('ver_detalle_evaluacion'),
  async (req, res) => {
    try {
      const { evaluationId } = req.params;
      const estudianteId = req.user.estudiante.id;

      const evaluacion = await prisma.evaluacion.findFirst({
        where: {
          id: parseInt(evaluationId),
          estudianteId // Solo puede ver sus propias evaluaciones
        }
      });

      if (!evaluacion) {
        return res.status(404).json({
          success: false,
          message: 'Evaluación no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: { evaluacion }
      });

    } catch (error) {
      console.error('Error obteniendo detalle de evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

export default router;