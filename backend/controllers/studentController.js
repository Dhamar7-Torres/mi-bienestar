import { prisma } from '../utils/prisma.js';
import RiskCalculator from '../utils/riskCalculator.js';

class StudentController {
  static riskCalculator = new RiskCalculator();

  /**
   * Obtener dashboard del estudiante
   */
  static async getDashboard(req, res) {
    try {
      const estudianteId = req.user.estudiante.id;

      // Obtener información básica del estudiante
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        include: {
          usuario: {
            select: {
              nombreCompleto: true,
              correo: true
            }
          },
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 5,
            select: {
              id: true,
              puntajeEstres: true,
              puntajeBurnout: true,
              puntajeTotal: true,
              nivelRiesgo: true,
              fechaEvaluacion: true
            }
          },
          alertas: {
            where: { estaLeida: false },
            orderBy: { fechaCreacion: 'desc' },
            take: 3
          }
        }
      });

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      // Calcular estadísticas de evaluaciones
      const evaluacionesEstadisticas = await this.calculateEvaluationStats(estudianteId);

      // Verificar si puede hacer evaluación semanal
      const puedeEvaluar = await this.canTakeWeeklyEvaluation(estudianteId);

      // Obtener progreso semanal
      const progresoSemanal = await this.getWeeklyProgress(estudianteId);

      // Preparar respuesta del dashboard
      const dashboardData = {
        estudiante: {
          id: estudiante.id,
          nombreCompleto: estudiante.usuario.nombreCompleto,
          correo: estudiante.usuario.correo,
          carrera: estudiante.carrera,
          semestre: estudiante.semestre,
          estadoActual: {
            nivelEstres: estudiante.nivelEstresActual,
            nivelBurnout: estudiante.nivelBurnoutActual,
            estadoRiesgo: estudiante.estadoRiesgo,
            fechaUltimaEvaluacion: estudiante.fechaUltimaEvaluacion
          }
        },
        evaluacionSemanal: {
          puedeEvaluar: puedeEvaluar.canEvaluate,
          razon: puedeEvaluar.reason,
          proximaDisponible: puedeEvaluar.nextAvailable
        },
        estadisticas: evaluacionesEstadisticas,
        evaluacionesRecientes: estudiante.evaluaciones,
        alertasActivas: estudiante.alertas,
        progresoSemanal
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error obteniendo dashboard del estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener preguntas para evaluación
   */
  static async getEvaluationQuestions(req, res) {
    try {
      const preguntas = await prisma.preguntaEvaluacion.findMany({
        where: { activa: true },
        orderBy: [
          { categoria: 'asc' },
          { orden: 'asc' }
        ]
      });

      // Separar preguntas por categoría
      const preguntasEstres = preguntas
        .filter(p => p.categoria === 'ESTRES')
        .map(p => ({
          id: p.id,
          texto: p.textoPregunta,
          peso: p.peso,
          orden: p.orden
        }));

      const preguntasBurnout = preguntas
        .filter(p => p.categoria === 'BURNOUT')
        .map(p => ({
          id: p.id,
          texto: p.textoPregunta,
          peso: p.peso,
          orden: p.orden
        }));

      res.status(200).json({
        success: true,
        data: {
          estres: preguntasEstres,
          burnout: preguntasBurnout,
          escalas: {
            descripcion: 'Escala de 0 a 4',
            valores: [
              { valor: 0, etiqueta: 'Nunca' },
              { valor: 1, etiqueta: 'Rara vez' },
              { valor: 2, etiqueta: 'A veces' },
              { valor: 3, etiqueta: 'Frecuentemente' },
              { valor: 4, etiqueta: 'Siempre' }
            ]
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo preguntas de evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Procesar evaluación semanal
   */
  static async processWeeklyEvaluation(req, res) {
    try {
      const estudianteId = req.user.estudiante.id;
      const { respuestasEstres, respuestasBurnout } = req.body;

      // Verificar si puede hacer evaluación
      const puedeEvaluar = await this.canTakeWeeklyEvaluation(estudianteId);
      if (!puedeEvaluar.canEvaluate) {
        return res.status(429).json({
          success: false,
          message: puedeEvaluar.reason,
          nextAvailable: puedeEvaluar.nextAvailable
        });
      }

      // Obtener pesos de las preguntas
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

      // Obtener perfil del estudiante para ajustes
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        select: {
          semestre: true,
          carrera: true
        }
      });

      // Procesar evaluación con calculadora de riesgo
      const resultadoEvaluacion = this.riskCalculator.processEvaluation({
        stressAnswers: respuestasEstres,
        burnoutAnswers: respuestasBurnout,
        stressWeights: pesosEstres,
        burnoutWeights: pesosBurnout,
        studentProfile: estudiante
      });

      // Guardar evaluación en base de datos
      const nuevaEvaluacion = await prisma.evaluacion.create({
        data: {
          estudianteId,
          puntajeEstres: resultadoEvaluacion.scores.stress,
          puntajeBurnout: resultadoEvaluacion.scores.burnout,
          puntajeTotal: resultadoEvaluacion.scores.total,
          nivelRiesgo: resultadoEvaluacion.riskLevels.overall,
          respuestas: {
            estres: respuestasEstres,
            burnout: respuestasBurnout,
            metadata: resultadoEvaluacion.metadata
          }
        }
      });

      // Actualizar estado del estudiante
      await prisma.estudiante.update({
        where: { id: estudianteId },
        data: {
          nivelEstresActual: resultadoEvaluacion.scores.stress,
          nivelBurnoutActual: resultadoEvaluacion.scores.burnout,
          estadoRiesgo: resultadoEvaluacion.riskLevels.overall,
          fechaUltimaEvaluacion: new Date()
        }
      });

      // Generar alerta si es necesario
      const alertInfo = this.riskCalculator.shouldGenerateAlert(
        resultadoEvaluacion.riskLevels.overall,
        resultadoEvaluacion.scores.stress,
        resultadoEvaluacion.scores.burnout
      );

      if (alertInfo.needed) {
        await prisma.alerta.create({
          data: {
            estudianteId,
            tipoAlerta: alertInfo.type,
            severidad: alertInfo.severity,
            mensaje: alertInfo.message
          }
        });
      }

      // Preparar respuesta
      const respuesta = {
        evaluacion: {
          id: nuevaEvaluacion.id,
          fecha: nuevaEvaluacion.fechaEvaluacion,
          puntajes: resultadoEvaluacion.scores,
          nivelesRiesgo: resultadoEvaluacion.riskLevels
        },
        analisis: resultadoEvaluacion.analysis,
        recomendaciones: resultadoEvaluacion.recommendations,
        alertaGenerada: alertInfo.needed
      };

      res.status(201).json({
        success: true,
        message: 'Evaluación procesada exitosamente',
        data: respuesta
      });

    } catch (error) {
      console.error('Error procesando evaluación semanal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener historial de evaluaciones
   */
  static async getEvaluationHistory(req, res) {
    try {
      const estudianteId = req.user.estudiante.id;
      const { limite = 10, pagina = 1 } = req.query;

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
          fechaEvaluacion: true,
          respuestas: true
        }
      });

      const totalEvaluaciones = await prisma.evaluacion.count({
        where: { estudianteId }
      });

      res.status(200).json({
        success: true,
        data: {
          evaluaciones,
          paginacion: {
            total: totalEvaluaciones,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(totalEvaluaciones / parseInt(limite))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial de evaluaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener recursos educativos
   */
  static async getResources(req, res) {
    try {
      const { categoria, tipo } = req.query;

      const filtros = { activo: true };
      if (categoria) filtros.categoria = categoria;
      if (tipo) filtros.tipoRecurso = tipo;

      const recursos = await prisma.recurso.findMany({
        where: filtros,
        orderBy: [
          { categoria: 'asc' },
          { titulo: 'asc' }
        ]
      });

      // Agrupar recursos por categoría
      const recursosPorCategoria = recursos.reduce((acc, recurso) => {
        const cat = recurso.categoria || 'General';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push({
          id: recurso.id,
          titulo: recurso.titulo,
          descripcion: recurso.descripcion,
          tipo: recurso.tipoRecurso,
          url: recurso.urlContenido
        });
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        data: {
          categorias: Object.keys(recursosPorCategoria),
          recursos: recursosPorCategoria
        }
      });

    } catch (error) {
      console.error('Error obteniendo recursos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Marcar alerta como leída
   */
  static async markAlertAsRead(req, res) {
    try {
      const { alertaId } = req.params;
      const estudianteId = req.user.estudiante.id;

      const alerta = await prisma.alerta.findFirst({
        where: {
          id: parseInt(alertaId),
          estudianteId
        }
      });

      if (!alerta) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada'
        });
      }

      await prisma.alerta.update({
        where: { id: parseInt(alertaId) },
        data: { estaLeida: true }
      });

      res.status(200).json({
        success: true,
        message: 'Alerta marcada como leída'
      });

    } catch (error) {
      console.error('Error marcando alerta como leída:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // MÉTODOS AUXILIARES

  /**
   * Verificar si puede hacer evaluación semanal
   */
  static async canTakeWeeklyEvaluation(estudianteId) {
    try {
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const evaluacionesSemana = await prisma.evaluacion.count({
        where: {
          estudianteId,
          fechaEvaluacion: {
            gte: inicioSemana
          }
        }
      });

      if (evaluacionesSemana >= 2) {
        const proximaSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000);
        return {
          canEvaluate: false,
          reason: 'Has alcanzado el límite de evaluaciones por semana (2)',
          nextAvailable: proximaSemana
        };
      }

      return {
        canEvaluate: true,
        reason: null,
        nextAvailable: null
      };

    } catch (error) {
      console.error('Error verificando disponibilidad de evaluación:', error);
      return {
        canEvaluate: false,
        reason: 'Error verificando disponibilidad',
        nextAvailable: null
      };
    }
  }

  /**
   * Calcular estadísticas de evaluaciones
   */
  static async calculateEvaluationStats(estudianteId) {
    try {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: { estudianteId },
        orderBy: { fechaEvaluacion: 'desc' },
        take: 10
      });

      if (evaluaciones.length === 0) {
        return {
          totalEvaluaciones: 0,
          promedioEstres: 0,
          promedioBurnout: 0,
          tendencia: 'sin_datos'
        };
      }

      const promedioEstres = evaluaciones.reduce((sum, ev) => sum + ev.puntajeEstres, 0) / evaluaciones.length;
      const promedioBurnout = evaluaciones.reduce((sum, ev) => sum + ev.puntajeBurnout, 0) / evaluaciones.length;

      // Calcular tendencia básica (últimas 3 vs anteriores)
      let tendencia = 'estable';
      if (evaluaciones.length >= 6) {
        const recientes = evaluaciones.slice(0, 3);
        const anteriores = evaluaciones.slice(3, 6);

        const promedioReciente = recientes.reduce((sum, ev) => sum + ev.puntajeTotal, 0) / recientes.length;
        const promedioAnterior = anteriores.reduce((sum, ev) => sum + ev.puntajeTotal, 0) / anteriores.length;

        if (promedioReciente > promedioAnterior + 1) {
          tendencia = 'empeorando';
        } else if (promedioReciente < promedioAnterior - 1) {
          tendencia = 'mejorando';
        }
      }

      return {
        totalEvaluaciones: evaluaciones.length,
        promedioEstres: Math.round(promedioEstres * 10) / 10,
        promedioBurnout: Math.round(promedioBurnout * 10) / 10,
        tendencia
      };

    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return {
        totalEvaluaciones: 0,
        promedioEstres: 0,
        promedioBurnout: 0,
        tendencia: 'error'
      };
    }
  }

  /**
   * Obtener progreso semanal
   */
  static async getWeeklyProgress(estudianteId) {
    try {
      const hoy = new Date();
      const ultimoMes = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          estudianteId,
          fechaEvaluacion: {
            gte: ultimoMes
          }
        },
        orderBy: { fechaEvaluacion: 'asc' }
      });

      // Agrupar por semana
      const semanas = {};
      evaluaciones.forEach(evaluacion => {
        const fecha = new Date(evaluacion.fechaEvaluacion);
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        const claveSemanea = inicioSemana.toISOString().split('T')[0];

        if (!semanas[claveSemanea]) {
          semanas[claveSemanea] = [];
        }
        semanas[claveSemanea].push(evaluacion);
      });

      // Calcular promedio por semana
      const progresoSemanal = Object.entries(semanas).map(([semana, evals]) => {
        const promedioEstres = evals.reduce((sum, ev) => sum + ev.puntajeEstres, 0) / evals.length;
        const promedioBurnout = evals.reduce((sum, ev) => sum + ev.puntajeBurnout, 0) / evals.length;

        return {
          semana,
          evaluaciones: evals.length,
          promedioEstres: Math.round(promedioEstres * 10) / 10,
          promedioBurnout: Math.round(promedioBurnout * 10) / 10
        };
      });

      return progresoSemanal;

    } catch (error) {
      console.error('Error obteniendo progreso semanal:', error);
      return [];
    }
  }
}

export default StudentController;