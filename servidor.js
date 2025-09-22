const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRETO);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: {
        estudiante: true,
        coordinador: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario,
      estudiante: usuario.estudiante[0] || null,
      coordinador: usuario.coordinador[0] || null
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// ===== CLASE RISKCALCULATOR INTEGRADA =====
class RiskCalculator {
  constructor() {
    this.config = {
      categoryWeights: {
        ESTRES: 1.2,
        BURNOUT: 1.3
      },
      riskThresholds: {
        BAJO: { min: 0, max: 4.0 },
        MEDIO: { min: 4.1, max: 6.0 },
        ALTO: { min: 6.1, max: 10 }
      }
    };
  }

  calculateCategoryScore(answers, weights, category) {
    if (!answers || answers.length === 0) {
      return { score: 0, details: [] };
    }

    let totalScore = 0;
    let totalWeight = 0;

    answers.forEach((answer, index) => {
      const weight = weights[index] || 1;
      totalScore += answer * weight;
      totalWeight += weight;
    });

    const averageScore = totalScore / totalWeight;
    const normalizedScore = (averageScore / 4) * 10;
    
    return {
      score: Math.round(normalizedScore * 10) / 10,
      averageScore
    };
  }

  determineRiskLevel(score) {
    const thresholds = this.config.riskThresholds;
    
    if (score >= thresholds.ALTO.min) {
      return 'ALTO';
    } else if (score >= thresholds.MEDIO.min) {
      return 'MEDIO';
    } else {
      return 'BAJO';
    }
  }

  processEvaluation(evaluationData) {
    const { stressAnswers, burnoutAnswers, stressWeights, burnoutWeights } = evaluationData;

    const stressResult = this.calculateCategoryScore(stressAnswers, stressWeights, 'ESTRES');
    const burnoutResult = this.calculateCategoryScore(burnoutAnswers, burnoutWeights, 'BURNOUT');

    const weightedTotal = (
      (stressResult.score * this.config.categoryWeights.ESTRES) +
      (burnoutResult.score * this.config.categoryWeights.BURNOUT)
    ) / (this.config.categoryWeights.ESTRES + this.config.categoryWeights.BURNOUT);

    const overallRiskLevel = this.determineRiskLevel(weightedTotal);
    const stressRiskLevel = this.determineRiskLevel(stressResult.score);
    const burnoutRiskLevel = this.determineRiskLevel(burnoutResult.score);

    return {
      scores: {
        stress: Math.round(stressResult.score),
        burnout: Math.round(burnoutResult.score),
        total: Math.round(weightedTotal)
      },
      riskLevels: {
        overall: overallRiskLevel,
        stress: stressRiskLevel,
        burnout: burnoutRiskLevel
      }
    };
  }

  shouldGenerateAlert(overallRisk, stressScore, burnoutScore) {
    console.log('EVALUANDO ALERTAS:');
    console.log(`Estrés: ${stressScore}, Burnout: ${burnoutScore}, General: ${overallRisk}`);
    
    const alerts = [];
    
    const stressRiskLevel = this.determineRiskLevel(stressScore);
    const burnoutRiskLevel = this.determineRiskLevel(burnoutScore);
    
    console.log(`Niveles individuales - Estrés: ${stressRiskLevel}, Burnout: ${burnoutRiskLevel}`);
    
    if (stressRiskLevel === 'ALTO') {
      alerts.push({
        type: 'Estrés Alto',
        severity: 'ALTO',
        message: `Niveles críticos de estrés detectados (${Math.round(stressScore)}/10)`
      });
    }
    
    if (burnoutRiskLevel === 'ALTO') {
      alerts.push({
        type: 'Burnout Alto',
        severity: 'ALTO',
        message: `Niveles críticos de burnout detectados (${Math.round(burnoutScore)}/10)`
      });
    }
    
    if (alerts.length === 0 && stressRiskLevel === 'MEDIO') {
      alerts.push({
        type: 'Estrés Moderado',
        severity: 'MEDIO',
        message: `Niveles moderados de estrés detectados (${Math.round(stressScore)}/10)`
      });
    }
    
    if (alerts.length === 0 && burnoutRiskLevel === 'MEDIO') {
      alerts.push({
        type: 'Burnout Moderado',
        severity: 'MEDIO',
        message: `Síntomas moderados de burnout detectados (${Math.round(burnoutScore)}/10)`
      });
    }
    
    console.log(`Total alertas generadas: ${alerts.length}`);
    
    if (alerts.length === 0) {
      return {
        needed: false,
        alerts: []
      };
    }
    
    return {
      needed: true,
      alerts: alerts
    };
  }
}

const riskCalculator = new RiskCalculator();

// ===== RUTAS DE AUTENTICACIÓN =====

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombreCompleto, correo, contrasena, tipoUsuario, carrera, semestre, departamento } = req.body;

    if (!nombreCompleto || !correo || !contrasena || !tipoUsuario) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos básicos son obligatorios'
      });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico'
      });
    }

    if (tipoUsuario === 'ESTUDIANTE' && (!carrera || !semestre)) {
      return res.status(400).json({
        success: false,
        message: 'Carrera y semestre son obligatorios para estudiantes'
      });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        correo,
        contrasenaHash,
        tipoUsuario
      }
    });

    let perfilEspecifico = null;

    if (tipoUsuario === 'ESTUDIANTE') {
      perfilEspecifico = await prisma.estudiante.create({
        data: {
          usuarioId: nuevoUsuario.id,
          carrera,
          semestre: parseInt(semestre)
        }
      });
    } else if (tipoUsuario === 'COORDINADOR') {
      perfilEspecifico = await prisma.coordinador.create({
        data: {
          usuarioId: nuevoUsuario.id,
          departamento
        }
      });
    }

    const token = jwt.sign(
      { userId: nuevoUsuario.id, tipoUsuario: nuevoUsuario.tipoUsuario },
      process.env.JWT_SECRETO,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        usuario: {
          id: nuevoUsuario.id,
          nombreCompleto: nuevoUsuario.nombreCompleto,
          correo: nuevoUsuario.correo,
          tipoUsuario: nuevoUsuario.tipoUsuario,
          estudiante: tipoUsuario === 'ESTUDIANTE' ? perfilEspecifico : undefined,
          coordinador: tipoUsuario === 'COORDINADOR' ? perfilEspecifico : undefined
        }
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el registro'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: {
        estudiante: true,
        coordinador: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

    if (!contrasenaValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { userId: usuario.id, tipoUsuario: usuario.tipoUsuario },
      process.env.JWT_SECRETO,
      { expiresIn: '7d' }
    );

    const datosRespuesta = {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario
    };

    if (usuario.tipoUsuario === 'ESTUDIANTE' && usuario.estudiante[0]) {
      datosRespuesta.estudiante = usuario.estudiante[0];
    } else if (usuario.tipoUsuario === 'COORDINADOR' && usuario.coordinador[0]) {
      datosRespuesta.coordinador = usuario.coordinador[0];
    }

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        usuario: datosRespuesta
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== RUTA CLAVE: EVALUACIÓN CORREGIDA =====

app.post('/api/students/evaluation/submit', authenticateToken, async (req, res) => {
  try {
    console.log('\n=== PROCESANDO EVALUACIÓN ===');
    console.log('Usuario:', req.user.nombreCompleto);
    
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

    const { respuestasEstres, respuestasBurnout } = req.body;
    const estudianteId = req.user.estudiante?.id;

    console.log('Datos recibidos:', { respuestasEstres, respuestasBurnout, estudianteId });

    if (!estudianteId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de estudiante no encontrado'
      });
    }

    if (!respuestasEstres || !respuestasBurnout || !Array.isArray(respuestasEstres) || !Array.isArray(respuestasBurnout)) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren respuestas válidas para ambas categorías'
      });
    }

    // Verificar límite semanal
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
      return res.status(429).json({
        success: false,
        message: 'Has alcanzado el límite de 2 evaluaciones por semana'
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

    console.log('Pesos obtenidos:', { pesosEstres, pesosBurnout });

    // Procesar evaluación
    const resultado = riskCalculator.processEvaluation({
      stressAnswers: respuestasEstres,
      burnoutAnswers: respuestasBurnout,
      stressWeights: pesosEstres,
      burnoutWeights: pesosBurnout
    });

    console.log('Resultado procesado:', resultado);

    // Guardar evaluación
    console.log('Guardando evaluación...');
    const evaluacion = await prisma.evaluacion.create({
      data: {
        estudianteId,
        puntajeEstres: resultado.scores.stress,
        puntajeBurnout: resultado.scores.burnout,
        puntajeTotal: resultado.scores.total,
        nivelRiesgo: resultado.riskLevels.overall,
        respuestas: {
          estres: respuestasEstres,
          burnout: respuestasBurnout
        }
      }
    });

    console.log('Evaluación guardada:', evaluacion.id);

    // Actualizar estudiante
    console.log('Actualizando estudiante...');
    await prisma.estudiante.update({
      where: { id: estudianteId },
      data: {
        nivelEstresActual: resultado.scores.stress,
        nivelBurnoutActual: resultado.scores.burnout,
        estadoRiesgo: resultado.riskLevels.overall,
        fechaUltimaEvaluacion: new Date()
      }
    });

    console.log('Estudiante actualizado');

    // Generar alertas
    console.log('Generando alertas...');
    const alertInfo = riskCalculator.shouldGenerateAlert(
      resultado.riskLevels.overall,
      resultado.scores.stress,
      resultado.scores.burnout
    );

    let alertasCreadas = [];
    if (alertInfo.needed && alertInfo.alerts && alertInfo.alerts.length > 0) {
      for (const alert of alertInfo.alerts) {
        console.log('Creando alerta:', alert.type);
        
        const nuevaAlerta = await prisma.alerta.create({
          data: {
            estudianteId,
            tipoAlerta: alert.type,
            severidad: alert.severity,
            mensaje: alert.message
          }
        });
        
        alertasCreadas.push({
          id: nuevaAlerta.id,
          tipo: alert.type,
          severidad: alert.severity,
          mensaje: alert.message
        });
      }
    }

    console.log(`Alertas creadas: ${alertasCreadas.length}`);

    res.status(201).json({
      success: true,
      message: `Evaluación procesada exitosamente${alertasCreadas.length > 0 ? ` con ${alertasCreadas.length} alertas` : ''}`,
      data: {
        evaluacion: {
          id: evaluacion.id,
          fecha: evaluacion.fechaEvaluacion,
          puntajes: resultado.scores,
          nivelesRiesgo: resultado.riskLevels
        },
        alertasGeneradas: alertasCreadas
      }
    });

  } catch (error) {
    console.error('Error procesando evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== RESTO DE RUTAS ESTUDIANTILES =====

app.get('/api/students/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

    const estudianteId = req.user.estudiante?.id;

    if (!estudianteId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de estudiante no encontrado'
      });
    }

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
          take: 5
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

    // Calcular estadísticas
    const totalEvaluaciones = await prisma.evaluacion.count({
      where: { estudianteId }
    });

    const evaluaciones = await prisma.evaluacion.findMany({
      where: { estudianteId },
      orderBy: { fechaEvaluacion: 'desc' }
    });

    let promedioEstres = 0;
    let promedioBurnout = 0;
    let tendencia = 'sin_datos';

    if (evaluaciones.length > 0) {
      promedioEstres = evaluaciones.reduce((sum, ev) => sum + ev.puntajeEstres, 0) / evaluaciones.length;
      promedioBurnout = evaluaciones.reduce((sum, ev) => sum + ev.puntajeBurnout, 0) / evaluaciones.length;
      
      if (evaluaciones.length >= 2) {
        const ultimaEvaluacion = evaluaciones[0];
        const penultimaEvaluacion = evaluaciones[1];
        const cambio = ultimaEvaluacion.puntajeTotal - penultimaEvaluacion.puntajeTotal;
        
        if (cambio > 1) {
          tendencia = 'empeorando';
        } else if (cambio < -1) {
          tendencia = 'mejorando';
        } else {
          tendencia = 'estable';
        }
      }
    }

    // Verificar si puede hacer evaluación
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

    const puedeEvaluar = evaluacionesSemana < 2;
    const proximaSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000);

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
        puedeEvaluar,
        razon: puedeEvaluar ? null : 'Has alcanzado el límite de evaluaciones por semana (2)',
        proximaDisponible: puedeEvaluar ? null : proximaSemana
      },
      estadisticas: {
        totalEvaluaciones,
        promedioEstres: Math.round(promedioEstres * 10) / 10,
        promedioBurnout: Math.round(promedioBurnout * 10) / 10,
        tendencia
      },
      evaluacionesRecientes: estudiante.evaluaciones,
      alertasActivas: estudiante.alertas,
      progresoSemanal: []
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
});

app.get('/api/students/evaluation/questions', authenticateToken, async (req, res) => {
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

    const preguntasEstres = preguntas
      .filter(p => p.categoria === 'ESTRES')
      .map((p, index) => ({
        id: p.id,
        numero: index + 1,
        texto: p.textoPregunta,
        categoria: p.categoria,
        peso: p.peso,
        orden: p.orden
      }));

    const preguntasBurnout = preguntas
      .filter(p => p.categoria === 'BURNOUT')
      .map((p, index) => ({
        id: p.id,
        numero: index + 1,
        texto: p.textoPregunta,
        categoria: p.categoria,
        peso: p.peso,
        orden: p.orden
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
});

app.get('/api/students/evaluation/history', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

    const { pagina = 1, limite = 10 } = req.query;
    const estudianteId = req.user.estudiante?.id;

    if (!estudianteId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de estudiante no encontrado'
      });
    }

    const evaluaciones = await prisma.evaluacion.findMany({
      where: { estudianteId },
      orderBy: { fechaEvaluacion: 'desc' },
      take: parseInt(limite),
      skip: (parseInt(pagina) - 1) * parseInt(limite)
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
});

// ===== RUTAS DE COORDINADORES =====

app.get('/api/coordinators/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    const totalEstudiantes = await prisma.estudiante.count();
    
    const estudiantesPorRiesgo = await prisma.estudiante.groupBy({
      by: ['estadoRiesgo'],
      _count: true
    });

    const alertasRiesgoAlto = await prisma.alerta.count({
      where: { severidad: 'ALTO' }
    });

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const evaluacionesSemana = await prisma.evaluacion.count({
      where: {
        fechaEvaluacion: { gte: inicioSemana }
      }
    });

    const tasaRespuestaSemanal = totalEstudiantes > 0 
      ? Math.min(100, Math.round((evaluacionesSemana / totalEstudiantes) * 100))
      : 0;

    const estadisticasEstres = await prisma.evaluacion.aggregate({
      _avg: {
        puntajeEstres: true,
        puntajeBurnout: true
      }
    });

    const promedioEstres = estadisticasEstres._avg.puntajeEstres || 0;
    const promedioBurnout = estadisticasEstres._avg.puntajeBurnout || 0;

    const estudiantesRiesgoAlto = await prisma.estudiante.findMany({
      where: { estadoRiesgo: 'ALTO' },
      include: {
        usuario: {
          select: { nombreCompleto: true }
        }
      },
      take: 10
    });

    const alertasRecientes = await prisma.alerta.findMany({
      include: {
        estudiante: {
          include: {
            usuario: {
              select: { nombreCompleto: true }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' },
      take: 10
    });

    const alertasFormateadas = alertasRecientes.map(alerta => ({
      ...alerta,
      estudiante: {
        id: alerta.estudiante.id,
        nombre: alerta.estudiante.usuario.nombreCompleto,
        carrera: alerta.estudiante.carrera,
        estadoRiesgo: alerta.estudiante.estadoRiesgo,
        usuario: alerta.estudiante.usuario
      }
    }));

    const dashboardData = {
      resumenGeneral: {
        totalEstudiantes,
        distribucionRiesgo: estudiantesPorRiesgo.reduce((acc, item) => {
          acc[item.estadoRiesgo.toLowerCase()] = item._count;
          return acc;
        }, { alto: 0, medio: 0, bajo: 0 }),
        alertasRiesgoAlto,
        tasaRespuestaSemanal,
        promedioEstres: Math.round(promedioEstres * 10) / 10,
        promedioBurnout: Math.round(promedioBurnout * 10) / 10
      },
      estudiantesRiesgoAlto,
      alertasRecientes: alertasFormateadas,
      tendenciasSemanales: []
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
});

app.get('/api/coordinators/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

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
        },
        alertas: {
          where: { estaLeida: false }
        }
      }
    });

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
      alertasActivas: est.alertas.length
    }));

    res.status(200).json({
      success: true,
      data: {
        estudiantes: estudiantesFormateados,
        paginacion: {
          total: estudiantes.length,
          pagina: 1,
          limite: 100,
          totalPaginas: 1
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
});

app.get('/api/coordinators/alerts', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    const alertas = await prisma.alerta.findMany({
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
      tiempoTranscurrido: 'hace 1h'
    }));

    res.status(200).json({
      success: true,
      data: {
        alertas: alertasFormateadas,
        paginacion: {
          total: alertas.length,
          pagina: 1,
          limite: 100,
          totalPaginas: 1
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
});

app.put('/api/coordinators/alerts/mark-read', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de alertas'
      });
    }

    const validIds = alertIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs de alertas inválidos'
      });
    }

    const resultado = await prisma.alerta.updateMany({
      where: {
        id: {
          in: validIds
        }
      },
      data: {
        estaLeida: true
      }
    });

    res.status(200).json({
      success: true,
      message: `${resultado.count} alerta${resultado.count > 1 ? 's' : ''} marcada${resultado.count > 1 ? 's' : ''} como leída${resultado.count > 1 ? 's' : ''}`,
      updatedCount: resultado.count
    });

  } catch (error) {
    console.error('Error marcando alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== RUTAS DE PRUEBA PARA DEBUG =====

app.get('/api/test/burnout-quick', authenticateToken, async (req, res) => {
  try {
    console.log('\n=== TEST RAPIDO BURNOUT ===');
    
    const resultado = riskCalculator.processEvaluation({
      stressAnswers: [1, 1, 1, 1, 1],
      burnoutAnswers: [4, 4, 4, 4, 4],
      stressWeights: [1, 1, 1, 1, 1],
      burnoutWeights: [1, 1, 1, 1, 1]
    });
    
    console.log('Puntajes:', resultado.scores);
    console.log('Niveles riesgo:', resultado.riskLevels);
    
    const alertInfo = riskCalculator.shouldGenerateAlert(
      resultado.riskLevels.overall,
      resultado.scores.stress,
      resultado.scores.burnout
    );
    
    console.log('Alert info:', alertInfo);
    
    res.json({
      success: true,
      puntajes: resultado.scores,
      niveles: resultado.riskLevels,
      alertas: alertInfo,
      mensaje: alertInfo.needed ? 'ALERTAS GENERADAS' : 'NO HAY ALERTAS - PROBLEMA DETECTADO'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS BÁSICAS =====

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente'
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count();
    const estudiantes = await prisma.estudiante.count();
    const preguntas = await prisma.preguntaEvaluacion.count();
    
    res.json({
      status: 'BD conectada',
      datos: { usuarios, estudiantes, preguntas },
      message: 'Base de datos funcionando correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error BD',
      error: error.message
    });
  }
});

// ===== ERROR HANDLERS =====

app.use('*', (req, res) => {
  console.log('Endpoint no encontrado:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Error del servidor:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ===== INICIAR SERVIDOR =====

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test burnout: http://localhost:${PORT}/api/test/burnout-quick`);
});

process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});