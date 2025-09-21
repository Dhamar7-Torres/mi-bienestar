import express from 'express';
import CoordinatorController from '../controllers/coordinatorController.js';
import { 
  authenticateToken, 
  requireCoordinator,
  logActivity 
} from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Middleware base para todas las rutas de coordinadores
router.use(authenticateToken);
router.use(requireCoordinator);

// GET /api/coordinators/dashboard - Dashboard del coordinador
router.get('/dashboard',
  logActivity('ver_dashboard_coordinador'),
  (req, res) => {
    CoordinatorController.getDashboard(req, res);
  }
);

// GET /api/coordinators/students - Lista de estudiantes con filtros
router.get('/students',
  logActivity('ver_lista_estudiantes'),
  (req, res) => {
    CoordinatorController.getStudentsList(req, res);
  }
);

// GET /api/coordinators/students/:studentId - Detalles de estudiante específico
router.get('/students/:studentId',
  logActivity('ver_detalles_estudiante'),
  (req, res) => {
    CoordinatorController.getStudentDetails(req, res);
  }
);

// GET /api/coordinators/alerts - Obtener alertas con filtros
router.get('/alerts',
  logActivity('ver_alertas'),
  (req, res) => {
    CoordinatorController.getAlerts(req, res);
  }
);

// PUT /api/coordinators/alerts/mark-read - Marcar alertas como leídas
router.put('/alerts/mark-read',
  logActivity('marcar_alertas_leidas'),
  (req, res) => {
    CoordinatorController.markAlertsAsRead(req, res);
  }
);

// POST /api/coordinators/reports/advanced - Generar reporte avanzado
router.post('/reports/advanced',
  logActivity('generar_reporte_avanzado'),
  (req, res) => {
    CoordinatorController.generateAdvancedReport(req, res);
  }
);

// POST /api/coordinators/reports/pdf - Generar reporte PDF
router.post('/reports/pdf',
  logActivity('generar_reporte_pdf'),
  (req, res) => {
    CoordinatorController.generatePDFReport(req, res);
  }
);

// GET /api/coordinators/export/students-pdf - Exportar estudiantes como PDF
router.get('/export/students-pdf',
  validateStudentFilters,
  logActivity('exportar_estudiantes_pdf'),
  (req, res) => {
    CoordinatorController.exportStudentsPDF(req, res);
  }
);

// GET /api/coordinators/stats/overview - Estadísticas generales
router.get('/stats/overview',
  logActivity('ver_estadisticas_generales'),
  async (req, res) => {
    try {
      const stats = await CoordinatorController.getGeneralStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/coordinators/stats/trends - Tendencias semanales
router.get('/stats/trends',
  logActivity('ver_tendencias'),
  async (req, res) => {
    try {
      const { weeks = 8 } = req.query;
      const trends = await CoordinatorController.getWeeklyTrends(parseInt(weeks));
      
      res.status(200).json({
        success: true,
        data: {
          trends,
          period: `${weeks} semanas`
        }
      });

    } catch (error) {
      console.error('Error obteniendo tendencias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/coordinators/stats/careers - Estadísticas por carrera
router.get('/stats/careers',
  logActivity('ver_estadisticas_carreras'),
  async (req, res) => {
    try {
      const careerStats = await CoordinatorController.getCareerDistribution();
      
      // Formatear datos para mejor presentación
      const formattedStats = careerStats.map(career => ({
        carrera: career.carrera,
        totalEstudiantes: career._count,
        promedioEstres: Math.round((career._avg.nivelEstresActual || 0) * 10) / 10,
        promedioBurnout: Math.round((career._avg.nivelBurnoutActual || 0) * 10) / 10
      }));

      res.status(200).json({
        success: true,
        data: {
          estadisticasPorCarrera: formattedStats,
          totalCarreras: formattedStats.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas por carrera:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/coordinators/students/:studentId/interventions - Historial de intervenciones (futuro)
router.get('/students/:studentId/interventions',
  logActivity('ver_intervenciones_estudiante'),
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Por ahora retorna placeholder - en futuras versiones incluirá:
      // - Intervenciones realizadas
      // - Seguimientos
      // - Resultados de intervenciones
      
      res.status(200).json({
        success: true,
        data: {
          intervenciones: [],
          nota: 'Sistema de intervenciones en desarrollo'
        }
      });

    } catch (error) {
      console.error('Error obteniendo intervenciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// POST /api/coordinators/students/:studentId/note - Agregar nota de seguimiento (futuro)
router.post('/students/:studentId/note',
  logActivity('agregar_nota_seguimiento'),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { nota, privada = true } = req.body;

      if (!nota || nota.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La nota no puede estar vacía'
        });
      }

      // Placeholder para funcionalidad futura
      // Aquí se implementaría el sistema de notas de seguimiento
      
      res.status(201).json({
        success: true,
        message: 'Funcionalidad de notas en desarrollo'
      });

    } catch (error) {
      console.error('Error agregando nota:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/coordinators/export/students - Exportar datos de estudiantes (CSV)
router.get('/export/students',
  logActivity('exportar_datos_estudiantes'),
  async (req, res) => {
    try {
      const { formato = 'json', filtroRiesgo, filtroCarrera } = req.query;

      const filtros = {};
      if (filtroRiesgo) filtros.estadoRiesgo = filtroRiesgo;
      if (filtroCarrera) filtros.carrera = { contains: filtroCarrera, mode: 'insensitive' };

      const estudiantes = await prisma.estudiante.findMany({
        where: filtros,
        include: {
          usuario: {
            select: {
              nombreCompleto: true,
              correo: true
            }
          },
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 1
          }
        }
      });

      const datosExportacion = estudiantes.map(est => ({
        nombre: est.usuario.nombreCompleto,
        correo: est.usuario.correo,
        carrera: est.carrera,
        semestre: est.semestre,
        estadoRiesgo: est.estadoRiesgo,
        nivelEstres: est.nivelEstresActual,
        nivelBurnout: est.nivelBurnoutActual,
        ultimaEvaluacion: est.fechaUltimaEvaluacion,
        totalEvaluaciones: est.evaluaciones.length
      }));

      if (formato === 'csv') {
        // En una implementación completa, aquí se generaría CSV
        res.status(501).json({
          success: false,
          message: 'Exportación CSV en desarrollo'
        });
      } else {
        res.status(200).json({
          success: true,
          data: {
            estudiantes: datosExportacion,
            total: datosExportacion.length,
            filtros: { riesgo: filtroRiesgo, carrera: filtroCarrera },
            fechaExportacion: new Date()
          }
        });
      }

    } catch (error) {
      console.error('Error exportando datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

export default router;