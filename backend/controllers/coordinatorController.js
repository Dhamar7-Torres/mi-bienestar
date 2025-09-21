import { prisma } from '../utils/prisma.js';
import RiskCalculator from '../utils/riskCalculator.js';

class CoordinatorController {
  /**
   * Obtener dashboard del coordinador con resumen general
   */
  static async getDashboard(req, res) {
    try {
      // Obtener estadísticas generales
      const estadisticasGenerales = await this.getGeneralStats();
      
      // Obtener estudiantes de riesgo alto
      const estudiantesRiesgoAlto = await this.getHighRiskStudents();
      
      // Obtener alertas recientes
      const alertasRecientes = await this.getRecentAlerts(10);
      
      // Obtener tendencias semanales
      const tendenciasSemanales = await this.getWeeklyTrends();

      const dashboardData = {
        resumenGeneral: estadisticasGenerales,
        estudiantesRiesgoAlto,
        alertasRecientes,
        tendenciasSemanales,
        ultimaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error obteniendo dashboard del coordinador:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener lista completa de estudiantes con filtros
   */
  static async getStudentsList(req, res) {
    try {
      const { 
        pagina = 1, 
        limite = 20, 
        filtroRiesgo, 
        filtroCarrera,
        busqueda,
        ordenarPor = 'nombreCompleto',
        orden = 'asc'
      } = req.query;

      // Construir filtros
      const filtros = {};
      
      if (filtroRiesgo) {
        filtros.estadoRiesgo = filtroRiesgo;
      }
      
      if (filtroCarrera) {
        filtros.carrera = {
          contains: filtroCarrera,
          mode: 'insensitive'
        };
      }

      let filtroUsuario = {};
      if (busqueda) {
        filtroUsuario = {
          nombreCompleto: {
            contains: busqueda,
            mode: 'insensitive'
          }
        };
      }

      // Determinar el campo de ordenamiento
      let campoOrden = {};
      if (ordenarPor === 'nombreCompleto') {
        campoOrden = {
          usuario: {
            nombreCompleto: orden
          }
        };
      } else {
        campoOrden = {
          [ordenarPor]: orden
        };
      }

      // Obtener estudiantes
      const estudiantes = await prisma.estudiante.findMany({
        where: {
          ...filtros,
          usuario: filtroUsuario
        },
        include: {
          usuario: {
            select: {
              nombreCompleto: true,
              correo: true
            }
          },
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 1,
            select: {
              fechaEvaluacion: true
            }
          },
          alertas: {
            where: { estaLeida: false },
            select: {
              id: true,
              severidad: true
            }
          }
        },
        orderBy: campoOrden,
        take: parseInt(limite),
        skip: (parseInt(pagina) - 1) * parseInt(limite)
      });

      // Contar total para paginación
      const totalEstudiantes = await prisma.estudiante.count({
        where: {
          ...filtros,
          usuario: filtroUsuario
        }
      });

      // Formatear datos de respuesta
      const estudiantesFormateados = estudiantes.map(est => ({
        id: est.id,
        nombreCompleto: est.usuario.nombreCompleto,
        correo: est.usuario.correo,
        carrera: est.carrera,
        semestre: est.semestre,
        estadoRiesgo: est.estadoRiesgo,
        nivelEstres: est.nivelEstresActual,
        nivelBurnout: est.nivelBurnoutActual,
        ultimaEvaluacion: est.evaluaciones[0]?.fechaEvaluacion || null,
        alertasActivas: est.alertas.length,
        alertasSeveridad: est.alertas.map(a => a.severidad)
      }));

      res.status(200).json({
        success: true,
        data: {
          estudiantes: estudiantesFormateados,
          paginacion: {
            total: totalEstudiantes,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(totalEstudiantes / parseInt(limite))
          },
          filtrosAplicados: {
            riesgo: filtroRiesgo,
            carrera: filtroCarrera,
            busqueda
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo lista de estudiantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
 * Generar reporte PDF para coordinadores
 */
static async generatePDFReport(req, res) {
  try {
    const { 
      fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fechaFin = new Date(),
      incluirDetalles = true,
      tipoReporte = 'completo' // 'completo', 'estadisticas', 'estudiantes'
    } = req.body;

    // Obtener estadísticas generales
    const estadisticasGenerales = await this.getGeneralStats();
    
    // Obtener lista de estudiantes
    const estudiantes = await prisma.estudiante.findMany({
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
      },
      orderBy: {
        estadoRiesgo: 'desc' // Primero los de riesgo alto
      }
    });

    // Obtener alertas recientes
    const alertas = await prisma.alerta.findMany({
      where: {
        fechaCreacion: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      },
      include: {
        estudiante: {
          include: {
            usuario: {
              select: { nombreCompleto: true }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    // Crear contenido del reporte
    const reporteData = {
      metadatos: {
        titulo: 'Reporte de Bienestar Estudiantil',
        fechaGeneracion: new Date().toISOString(),
        generadoPor: req.user.nombreCompleto,
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin
        },
        tipoReporte
      },
      estadisticasGenerales,
      estudiantes: estudiantes.map(est => ({
        id: est.id,
        nombre: est.usuario.nombreCompleto,
        correo: est.usuario.correo,
        carrera: est.carrera,
        semestre: est.semestre,
        estadoRiesgo: est.estadoRiesgo,
        nivelEstres: est.nivelEstresActual,
        nivelBurnout: est.nivelBurnoutActual,
        ultimaEvaluacion: est.evaluaciones[0]?.fechaEvaluacion || null
      })),
      alertas: alertas.map(alerta => ({
        fecha: alerta.fechaCreacion,
        estudiante: alerta.estudiante.usuario.nombreCompleto,
        tipo: alerta.tipoAlerta,
        severidad: alerta.severidad,
        mensaje: alerta.mensaje
      })),
      resumen: {
        totalEstudiantes: estudiantes.length,
        estudiantesRiesgoAlto: estudiantes.filter(e => e.estadoRiesgo === 'ALTO').length,
        estudiantesRiesgoMedio: estudiantes.filter(e => e.estadoRiesgo === 'MEDIO').length,
        estudiantesRiesgoBajo: estudiantes.filter(e => e.estadoRiesgo === 'BAJO').length,
        totalAlertas: alertas.length,
        alertasAltas: alertas.filter(a => a.severidad === 'ALTO').length
      }
    };

    res.status(200).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteData
    });

  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Exportar lista de estudiantes como PDF
 */
static async exportStudentsPDF(req, res) {
  try {
    const { 
      filtroRiesgo, 
      filtroCarrera,
      busqueda,
      incluirDetalles = true 
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (filtroRiesgo) {
      filtros.estadoRiesgo = filtroRiesgo;
    }
    
    if (filtroCarrera) {
      filtros.carrera = {
        contains: filtroCarrera,
        mode: 'insensitive'
      };
    }

    let filtroUsuario = {};
    if (busqueda) {
      filtroUsuario = {
        nombreCompleto: {
          contains: busqueda,
          mode: 'insensitive'
        }
      };
    }

    // Obtener estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        ...filtros,
        usuario: filtroUsuario
      },
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
          take: incluirDetalles ? 5 : 1,
          select: {
            fechaEvaluacion: true,
            puntajeEstres: true,
            puntajeBurnout: true,
            nivelRiesgo: true
          }
        },
        alertas: incluirDetalles ? {
          where: { estaLeida: false },
          select: {
            tipoAlerta: true,
            severidad: true,
            fechaCreacion: true
          }
        } : undefined
      },
      orderBy: [
        { estadoRiesgo: 'desc' },
        { usuario: { nombreCompleto: 'asc' } }
      ]
    });

    // Preparar datos para el PDF
    const estudiantesPDF = estudiantes.map(est => ({
      nombre: est.usuario.nombreCompleto,
      correo: est.usuario.correo,
      carrera: est.carrera,
      semestre: est.semestre,
      estadoRiesgo: est.estadoRiesgo,
      nivelEstres: est.nivelEstresActual || 0,
      nivelBurnout: est.nivelBurnoutActual || 0,
      ultimaEvaluacion: est.evaluaciones[0]?.fechaEvaluacion || null,
      totalEvaluaciones: est.evaluaciones.length,
      alertasActivas: incluirDetalles ? est.alertas?.length || 0 : 0,
      fechaRegistro: est.usuario.fechaCreacion
    }));

    const reportData = {
      titulo: 'Lista de Estudiantes - Sistema de Bienestar',
      fechaGeneracion: new Date().toISOString(),
      generadoPor: req.user.nombreCompleto,
      filtros: {
        riesgo: filtroRiesgo || 'Todos',
        carrera: filtroCarrera || 'Todas',
        busqueda: busqueda || 'Sin filtro'
      },
      total: estudiantesPDF.length,
      estudiantes: estudiantesPDF,
      resumen: {
        riesgoAlto: estudiantesPDF.filter(e => e.estadoRiesgo === 'ALTO').length,
        riesgoMedio: estudiantesPDF.filter(e => e.estadoRiesgo === 'MEDIO').length,
        riesgoBajo: estudiantesPDF.filter(e => e.estadoRiesgo === 'BAJO').length,
        promedioEstres: estudiantesPDF.reduce((sum, e) => sum + e.nivelEstres, 0) / estudiantesPDF.length,
        promedioBurnout: estudiantesPDF.reduce((sum, e) => sum + e.nivelBurnout, 0) / estudiantesPDF.length
      }
    };

    res.status(200).json({
      success: true,
      message: 'Lista de estudiantes exportada exitosamente',
      data: reportData
    });

  } catch (error) {
    console.error('Error exportando estudiantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

  /**
   * Obtener detalles de un estudiante específico
   */
  static async getStudentDetails(req, res) {
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
            take: 20
          },
          alertas: {
            orderBy: { fechaCreacion: 'desc' },
            take: 10
          }
        }
      });

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      // Calcular estadísticas adicionales
      const estadisticasDetalladas = await this.calculateDetailedStudentStats(parseInt(studentId));

      // Generar análisis de tendencia
      const analisisTendencia = this.analyzeTrend(estudiante.evaluaciones);

      const respuesta = {
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
            ultimaEvaluacion: estudiante.fechaUltimaEvaluacion
          },
          fechaRegistro: estudiante.usuario.fechaCreacion
        },
        evaluaciones: estudiante.evaluaciones,
        alertas: estudiante.alertas,
        estadisticas: estadisticasDetalladas,
        analisisTendencia
      };

      res.status(200).json({
        success: true,
        data: respuesta
      });

    } catch (error) {
      console.error('Error obteniendo detalles del estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener todas las alertas con filtros
   */
  static async getAlerts(req, res) {
    try {
      const {
        pagina = 1,
        limite = 20,
        severidad,
        leidas = false,
        fechaDesde,
        fechaHasta
      } = req.query;

      const filtros = {};

      if (severidad) {
        filtros.severidad = severidad;
      }

      if (leidas === 'false') {
        filtros.estaLeida = false;
      }

      if (fechaDesde || fechaHasta) {
        filtros.fechaCreacion = {};
        if (fechaDesde) {
          filtros.fechaCreacion.gte = new Date(fechaDesde);
        }
        if (fechaHasta) {
          filtros.fechaCreacion.lte = new Date(fechaHasta);
        }
      }

      const alertas = await prisma.alerta.findMany({
        where: filtros,
        include: {
          estudiante: {
            include: {
              usuario: {
                select: {
                  nombreCompleto: true
                }
              }
            }
          }
        },
        orderBy: { fechaCreacion: 'desc' },
        take: parseInt(limite),
        skip: (parseInt(pagina) - 1) * parseInt(limite)
      });

      const totalAlertas = await prisma.alerta.count({
        where: filtros
      });

      // Formatear alertas para respuesta
      const alertasFormateadas = alertas.map(alerta => ({
        id: alerta.id,
        tipo: alerta.tipoAlerta,
        severidad: alerta.severidad,
        mensaje: alerta.mensaje,
        fechaCreacion: alerta.fechaCreacion,
        estaLeida: alerta.estaLeida,
        estudiante: {
          id: alerta.estudiante.id,
          nombre: alerta.estudiante.usuario.nombreCompleto,
          carrera: alerta.estudiante.carrera,
          estadoRiesgo: alerta.estudiante.estadoRiesgo
        },
        tiempoTranscurrido: this.calculateTimeElapsed(alerta.fechaCreacion)
      }));

      res.status(200).json({
        success: true,
        data: {
          alertas: alertasFormateadas,
          paginacion: {
            total: totalAlertas,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(totalAlertas / parseInt(limite))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Marcar alertas como leídas
   */
  static async markAlertsAsRead(req, res) {
    try {
      const { alertIds } = req.body;

      if (!alertIds || !Array.isArray(alertIds)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de alertas'
        });
      }

      const resultado = await prisma.alerta.updateMany({
        where: {
          id: {
            in: alertIds.map(id => parseInt(id))
          }
        },
        data: {
          estaLeida: true
        }
      });

      res.status(200).json({
        success: true,
        message: `${resultado.count} alertas marcadas como leídas`
      });

    } catch (error) {
      console.error('Error marcando alertas como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Generar reporte de estadísticas avanzadas
   */
  static async generateAdvancedReport(req, res) {
    try {
      const { 
        fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fechaFin = new Date(),
        incluirDetalles = true 
      } = req.body;

      // Estadísticas generales
      const estadisticasGenerales = await this.getGeneralStats();

      // Tendencias por periodo
      const tendenciasPeriodo = await this.getPeriodTrends(new Date(fechaInicio), new Date(fechaFin));

      // Distribución por carrera
      const distribucionCarrera = await this.getCareerDistribution();

      // Análisis de riesgo por semestre
      const riesgoPorSemestre = await this.getRiskBySemester();

      // Efectividad de intervenciones (si se han implementado)
      const efectividadIntervenciones = await this.getInterventionEffectiveness();

      const reporte = {
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin
        },
        estadisticasGenerales,
        tendenciasPeriodo,
        distribucionCarrera,
        riesgoPorSemestre,
        efectividadIntervenciones,
        fechaGeneracion: new Date()
      };

      res.status(200).json({
        success: true,
        data: reporte
      });

    } catch (error) {
      console.error('Error generando reporte avanzado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // MÉTODOS AUXILIARES

  /**
   * Obtener estadísticas generales
   */
  static async getGeneralStats() {
    try {
      const totalEstudiantes = await prisma.estudiante.count();
      
      const estudiantesPorRiesgo = await prisma.estudiante.groupBy({
        by: ['estadoRiesgo'],
        _count: true
      });

      const alertasRiesgoAlto = await prisma.alerta.count({
        where: {
          severidad: 'ALTO',
          fechaCreacion: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Calcular tasa de respuesta semanal
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const evaluacionesEstaSemana = await prisma.evaluacion.count({
        where: {
          fechaEvaluacion: {
            gte: inicioSemana
          }
        }
      });

      const tasaRespuesta = totalEstudiantes > 0 
        ? Math.round((evaluacionesEstaSemana / totalEstudiantes) * 100 * 100) / 100
        : 0;

      // Promedio general de estrés y burnout
      const promedios = await prisma.estudiante.aggregate({
        _avg: {
          nivelEstresActual: true,
          nivelBurnoutActual: true
        }
      });

      return {
        totalEstudiantes,
        distribucionRiesgo: estudiantesPorRiesgo.reduce((acc, item) => {
          acc[item.estadoRiesgo.toLowerCase()] = item._count;
          return acc;
        }, { alto: 0, medio: 0, bajo: 0 }),
        alertasRiesgoAlto,
        tasaRespuestaSemanal: tasaRespuesta,
        promedioEstres: Math.round((promedios._avg.nivelEstresActual || 0) * 10) / 10,
        promedioBurnout: Math.round((promedios._avg.nivelBurnoutActual || 0) * 10) / 10
      };

    } catch (error) {
      console.error('Error calculando estadísticas generales:', error);
      throw error;
    }
  }

  /**
   * Obtener estudiantes de riesgo alto
   */
  static async getHighRiskStudents() {
    try {
      return await prisma.estudiante.findMany({
        where: {
          estadoRiesgo: 'ALTO'
        },
        include: {
          usuario: {
            select: {
              nombreCompleto: true
            }
          },
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 1,
            select: {
              fechaEvaluacion: true
            }
          }
        },
        orderBy: {
          fechaUltimaEvaluacion: 'desc'
        },
        take: 10
      });

    } catch (error) {
      console.error('Error obteniendo estudiantes de riesgo alto:', error);
      return [];
    }
  }

  /**
   * Obtener alertas recientes
   */
  static async getRecentAlerts(limite = 10) {
    try {
      return await prisma.alerta.findMany({
        include: {
          estudiante: {
            include: {
              usuario: {
                select: {
                  nombreCompleto: true
                }
              }
            }
          }
        },
        orderBy: { fechaCreacion: 'desc' },
        take: limite
      });

    } catch (error) {
      console.error('Error obteniendo alertas recientes:', error);
      return [];
    }
  }

  /**
   * Obtener tendencias semanales
   */
  static async getWeeklyTrends() {
    try {
      const ultimasOchoSemanas = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          fechaEvaluacion: {
            gte: ultimasOchoSemanas
          }
        },
        select: {
          puntajeEstres: true,
          puntajeBurnout: true,
          fechaEvaluacion: true
        },
        orderBy: { fechaEvaluacion: 'asc' }
      });

      // Agrupar por semana
      const tendenciasPorSemana = {};
      evaluaciones.forEach(ev => {
        const fecha = new Date(ev.fechaEvaluacion);
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        const claveSemana = inicioSemana.toISOString().split('T')[0];

        if (!tendenciasPorSemana[claveSemana]) {
          tendenciasPorSemana[claveSemana] = {
            evaluaciones: 0,
            sumaEstres: 0,
            sumaBurnout: 0
          };
        }

        tendenciasPorSemana[claveSemana].evaluaciones += 1;
        tendenciasPorSemana[claveSemana].sumaEstres += ev.puntajeEstres;
        tendenciasPorSemana[claveSemana].sumaBurnout += ev.puntajeBurnout;
      });

      // Calcular promedios
      const tendenciasFinales = Object.entries(tendenciasPorSemana).map(([semana, datos]) => ({
        semana,
        evaluaciones: datos.evaluaciones,
        promedioEstres: Math.round((datos.sumaEstres / datos.evaluaciones) * 10) / 10,
        promedioBurnout: Math.round((datos.sumaBurnout / datos.evaluaciones) * 10) / 10
      }));

      return tendenciasFinales.sort((a, b) => new Date(a.semana) - new Date(b.semana));

    } catch (error) {
      console.error('Error calculando tendencias semanales:', error);
      return [];
    }
  }

  /**
   * Calcular estadísticas detalladas de un estudiante
   */
  static async calculateDetailedStudentStats(studentId) {
    try {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: { estudianteId: studentId },
        orderBy: { fechaEvaluacion: 'desc' }
      });

      if (evaluaciones.length === 0) {
        return {
          totalEvaluaciones: 0,
          frecuenciaEvaluacion: 0,
          tendencia: 'sin_datos'
        };
      }

      // Calcular frecuencia de evaluación (evaluaciones por semana)
      const primeraEvaluacion = evaluaciones[evaluaciones.length - 1].fechaEvaluacion;
      const ultimaEvaluacion = evaluaciones[0].fechaEvaluacion;
      const semanas = Math.max(1, Math.ceil((ultimaEvaluacion - primeraEvaluacion) / (7 * 24 * 60 * 60 * 1000)));
      const frecuencia = evaluaciones.length / semanas;

      return {
        totalEvaluaciones: evaluaciones.length,
        frecuenciaEvaluacion: Math.round(frecuencia * 100) / 100,
        primerEvaluacion: primeraEvaluacion,
        ultimaEvaluacion: ultimaEvaluacion,
        periodoEvaluacion: semanas
      };

    } catch (error) {
      console.error('Error calculando estadísticas detalladas:', error);
      return {};
    }
  }

  /**
   * Analizar tendencia de evaluaciones
   */
  static analyzeTrend(evaluaciones) {
    if (evaluaciones.length < 3) {
      return {
        direccion: 'insuficientes_datos',
        confianza: 0
      };
    }

    const recientes = evaluaciones.slice(0, Math.ceil(evaluaciones.length / 2));
    const anteriores = evaluaciones.slice(Math.ceil(evaluaciones.length / 2));

    const promedioReciente = recientes.reduce((sum, ev) => sum + ev.puntajeTotal, 0) / recientes.length;
    const promedioAnterior = anteriores.reduce((sum, ev) => sum + ev.puntajeTotal, 0) / anteriores.length;

    const diferencia = promedioReciente - promedioAnterior;
    
    let direccion;
    if (Math.abs(diferencia) < 0.5) {
      direccion = 'estable';
    } else if (diferencia > 0) {
      direccion = 'empeorando';
    } else {
      direccion = 'mejorando';
    }

    return {
      direccion,
      diferencia: Math.round(diferencia * 100) / 100,
      confianza: Math.min(100, evaluaciones.length * 10) // Más evaluaciones = más confianza
    };
  }

  /**
   * Calcular tiempo transcurrido
   */
  static calculateTimeElapsed(fecha) {
    const ahora = new Date();
    const diferencia = ahora - new Date(fecha);
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias > 0) {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return 'hace menos de un minuto';
    }
  }

  /**
   * Obtener distribución por carrera
   */
  static async getCareerDistribution() {
    try {
      return await prisma.estudiante.groupBy({
        by: ['carrera'],
        _count: true,
        _avg: {
          nivelEstresActual: true,
          nivelBurnoutActual: true
        }
      });
    } catch (error) {
      console.error('Error obteniendo distribución por carrera:', error);
      return [];
    }
  }

  /**
   * Obtener análisis de riesgo por semestre
   */
  static async getRiskBySemester() {
    try {
      return await prisma.estudiante.groupBy({
        by: ['semestre', 'estadoRiesgo'],
        _count: true
      });
    } catch (error) {
      console.error('Error obteniendo riesgo por semestre:', error);
      return [];
    }
  }

  /**
   * Obtener efectividad de intervenciones (placeholder para funcionalidad futura)
   */
  static async getInterventionEffectiveness() {
    // En una implementación futura, aquí se analizaría:
    // - Mejora en puntajes después de intervenciones
    // - Reducción de alertas de riesgo alto
    // - Tiempo de recuperación promedio
    return {
      nota: 'Funcionalidad en desarrollo - requiere implementación de sistema de intervenciones'
    };
  }

  /**
   * Obtener tendencias por periodo específico
   */
  static async getPeriodTrends(fechaInicio, fechaFin) {
    try {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          fechaEvaluacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        select: {
          puntajeEstres: true,
          puntajeBurnout: true,
          puntajeTotal: true,
          fechaEvaluacion: true
        },
        orderBy: { fechaEvaluacion: 'asc' }
      });

      // Agrupar por semanas dentro del periodo
      const semanas = {};
      evaluaciones.forEach(ev => {
        const fecha = new Date(ev.fechaEvaluacion);
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        const clave = inicioSemana.toISOString().split('T')[0];

        if (!semanas[clave]) {
          semanas[clave] = [];
        }
        semanas[clave].push(ev);
      });

      return Object.entries(semanas).map(([semana, evals]) => ({
        semana,
        evaluaciones: evals.length,
        promedioEstres: evals.reduce((sum, ev) => sum + ev.puntajeEstres, 0) / evals.length,
        promedioBurnout: evals.reduce((sum, ev) => sum + ev.puntajeBurnout, 0) / evals.length,
        promedioTotal: evals.reduce((sum, ev) => sum + ev.puntajeTotal, 0) / evals.length
      }));

    } catch (error) {
      console.error('Error obteniendo tendencias por periodo:', error);
      return [];
    }
  }
}

export default CoordinatorController;
