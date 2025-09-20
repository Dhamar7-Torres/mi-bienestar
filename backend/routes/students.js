import express from 'express';
import StudentController from '../controllers/studentController.js';
import { 
  authenticateToken, 
  requireStudent, 
  requireStudentAccess,
  checkEvaluationLimits,
  logActivity 
} from '../middleware/auth.js';
import { 
  validateEvaluation, 
  handleValidationErrors 
} from '../utils/validators.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Middleware base para todas las rutas de estudiantes
router.use(authenticateToken);

// GET /api/students/dashboard - Dashboard del estudiante
router.get('/dashboard', 
  requireStudent,
  logActivity('ver_dashboard_estudiante'),
  (req, res) => {
    StudentController.getDashboard(req, res);
  }
);

// GET /api/students/evaluation/questions - Obtener preguntas para evaluación
router.get('/evaluation/questions',
  requireStudent,
  logActivity('obtener_preguntas_evaluacion'),
  (req, res) => {
    StudentController.getEvaluationQuestions(req, res);
  }
);

// POST /api/students/evaluation/submit - Enviar evaluación semanal
router.post('/evaluation/submit',
  requireStudent,
  checkEvaluationLimits,
  validateEvaluation,
  handleValidationErrors,
  logActivity('enviar_evaluacion_semanal'),
  (req, res) => {
    StudentController.processWeeklyEvaluation(req, res);
  }
);

// GET /api/students/evaluation/history - Historial de evaluaciones
router.get('/evaluation/history',
  requireStudent,
  logActivity('ver_historial_evaluaciones'),
  (req, res) => {
    StudentController.getEvaluationHistory(req, res);
  }
);

// GET /api/students/resources - Recursos educativos
router.get('/resources',
  requireStudent,
  logActivity('ver_recursos_educativos'),
  (req, res) => {
    StudentController.getResources(req, res);
  }
);

// PUT /api/students/alerts/:alertaId/read - Marcar alerta como leída
router.put('/alerts/:alertaId/read',
  requireStudent,
  logActivity('marcar_alerta_leida'),
  (req, res) => {
    StudentController.markAlertAsRead(req, res);
  }
);

// GET /api/students/:studentId/profile - Obtener perfil de estudiante específico (para coordinadores)
router.get('/:studentId/profile',
  requireStudentAccess,
  logActivity('ver_perfil_estudiante'),
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const estudiante = await prisma.estudiante.findUnique({
        where: { id: parseInt(studentId) },
        include: {
          usuario: {
            select: {
              nombreCompleto: true,
              correo: true,
              fechaCreacion: true
            }
          },
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 10
          },
          alertas: {
            orderBy: { fechaCreacion: 'desc' },
            take: 5
          }
        }
      });

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: { estudiante }
      });

    } catch (error) {
      console.error('Error obteniendo perfil del estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/students/stats/personal - Estadísticas personales del estudiante
router.get('/stats/personal',
  requireStudent,
  logActivity('ver_estadisticas_personales'),
  async (req, res) => {
    try {
      const estudianteId = req.user.estudiante.id;

      // Obtener estadísticas más detalladas
      const estadisticas = await StudentController.getDetailedPersonalStats(estudianteId);

      res.status(200).json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas personales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

export default router;