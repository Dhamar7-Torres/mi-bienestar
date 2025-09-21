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

// CORS
app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
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
      estudiante: usuario.estudiante,
      coordinador: usuario.coordinador
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

// ===== RUTAS DE AUTENTICACIÓN =====

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombreCompleto, correo, contrasena, tipoUsuario, carrera, semestre, departamento } = req.body;

    console.log('📝 Intento de registro:', { correo, tipoUsuario });

    // Validaciones básicas
    if (!nombreCompleto || !correo || !contrasena || !tipoUsuario) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos básicos son obligatorios'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico'
      });
    }

    // Validaciones específicas
    if (tipoUsuario === 'ESTUDIANTE' && (!carrera || !semestre)) {
      return res.status(400).json({
        success: false,
        message: 'Carrera y semestre son obligatorios para estudiantes'
      });
    }

    if (tipoUsuario === 'COORDINADOR' && !departamento) {
      return res.status(400).json({
        success: false,
        message: 'Departamento es obligatorio para coordinadores'
      });
    }

    // Hash de la contraseña
    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        correo,
        contrasenaHash,
        tipoUsuario
      }
    });

    // Crear perfil específico
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

    // Generar JWT
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
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el registro'
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    // Buscar usuario
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

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

    if (!contrasenaValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: usuario.id, tipoUsuario: usuario.tipoUsuario },
      process.env.JWT_SECRETO,
      { expiresIn: '7d' }
    );

    // Preparar datos de respuesta
    const datosRespuesta = {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario
    };

    if (usuario.tipoUsuario === 'ESTUDIANTE' && usuario.estudiante) {
      datosRespuesta.estudiante = usuario.estudiante;
    } else if (usuario.tipoUsuario === 'COORDINADOR' && usuario.coordinador) {
      datosRespuesta.coordinador = usuario.coordinador;
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
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== RUTAS PARA ESTUDIANTES =====

// GET /api/students/dashboard
app.get('/api/students/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

    const estudianteId = req.user.estudiante.id;

    // Obtener información del estudiante
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

    // Calcular estadísticas básicas
    const totalEvaluaciones = await prisma.evaluacion.count({
      where: { estudianteId }
    });

    const evaluaciones = await prisma.evaluacion.findMany({
      where: { estudianteId },
      orderBy: { fechaEvaluacion: 'desc' }
    });

    let promedioEstres = 0;
    let promedioBurnout = 0;
    if (evaluaciones.length > 0) {
      promedioEstres = evaluaciones.reduce((sum, ev) => sum + ev.puntajeEstres, 0) / evaluaciones.length;
      promedioBurnout = evaluaciones.reduce((sum, ev) => sum + ev.puntajeBurnout, 0) / evaluaciones.length;
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
        razon: puedeEvaluar ? null : 'Has alcanzado el límite de evaluaciones por semana (2)'
      },
      estadisticas: {
        totalEvaluaciones,
        promedioEstres: Math.round(promedioEstres * 10) / 10,
        promedioBurnout: Math.round(promedioBurnout * 10) / 10,
        tendencia: 'estable'
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

// ===== RUTAS PARA COORDINADORES =====

// GET /api/coordinators/dashboard
app.get('/api/coordinators/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    // Estadísticas generales
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

    // Tasa de respuesta semanal
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const evaluacionesEstaSemana = await prisma.evaluacion.count({
      where: {
        fechaEvaluacion: { gte: inicioSemana }
      }
    });

    const tasaRespuesta = totalEstudiantes > 0 
      ? Math.round((evaluacionesEstaSemana / totalEstudiantes) * 100)
      : 0;

    // Estudiantes de riesgo alto
    const estudiantesRiesgoAlto = await prisma.estudiante.findMany({
      where: { estadoRiesgo: 'ALTO' },
      include: {
        usuario: {
          select: { nombreCompleto: true }
        }
      },
      take: 10
    });

    // Alertas recientes
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

    const dashboardData = {
      resumenGeneral: {
        totalEstudiantes,
        distribucionRiesgo: estudiantesPorRiesgo.reduce((acc, item) => {
          acc[item.estadoRiesgo.toLowerCase()] = item._count;
          return acc;
        }, { alto: 0, medio: 0, bajo: 0 }),
        alertasRiesgoAlto,
        tasaRespuestaSemanal: tasaRespuesta,
        promedioEstres: 0,
        promedioBurnout: 0
      },
      estudiantesRiesgoAlto,
      alertasRecientes: alertasRecientes.map(alerta => ({
        ...alerta,
        tiempoTranscurrido: 'hace 1 hora' // Simplificado
      })),
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

// GET /api/students/resources
app.get('/api/students/resources', authenticateToken, async (req, res) => {
  try {
    const recursos = await prisma.recurso.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' }
    });

    // Agrupar por categoría
    const recursosPorCategoria = recursos.reduce((acc, recurso) => {
      const cat = recurso.categoria || 'General';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(recurso);
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
});

// GET /api/students/evaluation/questions
app.get('/api/students/evaluation/questions', authenticateToken, async (req, res) => {
  try {
    const preguntas = await prisma.preguntaEvaluacion.findMany({
      where: { activa: true },
      orderBy: { categoria: 'asc' }
    });

    const preguntasEstres = preguntas.filter(p => p.categoria === 'ESTRES');
    const preguntasBurnout = preguntas.filter(p => p.categoria === 'BURNOUT');

    res.status(200).json({
      success: true,
      data: {
        categorias: {
          estres: {
            titulo: 'Evaluación de Estrés Académico',
            descripcion: 'Responde según tu experiencia en las últimas 2 semanas',
            preguntas: preguntasEstres.map((p, index) => ({
              id: p.id,
              numero: index + 1,
              texto: p.textoPregunta,
              peso: p.peso
            }))
          },
          burnout: {
            titulo: 'Evaluación de Agotamiento (Burnout)',
            descripcion: 'Responde según cómo te has sentido en el último mes',
            preguntas: preguntasBurnout.map((p, index) => ({
              id: p.id,
              numero: index + 1,
              texto: p.textoPregunta,
              peso: p.peso
            }))
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
        }
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

// ===== RUTAS ADICIONALES PARA ESTUDIANTES =====

// GET /api/students/evaluation/history - Historial de evaluaciones
app.get('/api/students/evaluation/history', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

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
        fechaEvaluacion: true,
        respuestas: true
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
});

// POST /api/students/evaluation/submit - Enviar evaluación semanal
app.post('/api/students/evaluation/submit', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

    const { respuestasEstres, respuestasBurnout } = req.body;
    const estudianteId = req.user.estudiante.id;

    // Validar respuestas
    if (!respuestasEstres || !respuestasBurnout) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren respuestas para ambas categorías'
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

    // Calcular puntajes (lógica simple)
    const puntajeEstres = Math.round((respuestasEstres.reduce((a, b) => a + b, 0) / respuestasEstres.length) * 2.5);
    const puntajeBurnout = Math.round((respuestasBurnout.reduce((a, b) => a + b, 0) / respuestasBurnout.length) * 2.5);
    const puntajeTotal = Math.round((puntajeEstres + puntajeBurnout) / 2);

    // Determinar nivel de riesgo
    let nivelRiesgo = 'BAJO';
    if (puntajeTotal >= 7) {
      nivelRiesgo = 'ALTO';
    } else if (puntajeTotal >= 4) {
      nivelRiesgo = 'MEDIO';
    }

    // Guardar evaluación
    const evaluacion = await prisma.evaluacion.create({
      data: {
        estudianteId,
        puntajeEstres,
        puntajeBurnout,
        puntajeTotal,
        nivelRiesgo,
        respuestas: {
          estres: respuestasEstres,
          burnout: respuestasBurnout
        }
      }
    });

    // Actualizar estado del estudiante
    await prisma.estudiante.update({
      where: { id: estudianteId },
      data: {
        nivelEstresActual: puntajeEstres,
        nivelBurnoutActual: puntajeBurnout,
        estadoRiesgo: nivelRiesgo,
        fechaUltimaEvaluacion: new Date()
      }
    });

    // Generar alerta si es riesgo alto
    if (nivelRiesgo === 'ALTO') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id }
      });

      await prisma.alerta.create({
        data: {
          estudianteId,
          tipoAlerta: puntajeEstres >= puntajeBurnout ? 'Estrés Alto' : 'Burnout Alto',
          severidad: 'ALTO',
          mensaje: `${usuario.nombreCompleto} presenta niveles altos de ${puntajeEstres >= puntajeBurnout ? 'estrés' : 'burnout'} (${Math.max(puntajeEstres, puntajeBurnout)}/10)`
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
          puntajes: {
            stress: puntajeEstres,
            burnout: puntajeBurnout,
            total: puntajeTotal
          },
          nivelesRiesgo: {
            overall: nivelRiesgo
          }
        },
        recomendaciones: []
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

// ===== RUTAS ADICIONALES PARA COORDINADORES =====

// GET /api/coordinators/students - Lista de estudiantes
app.get('/api/coordinators/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    const { 
      pagina = 1, 
      limite = 20, 
      filtroRiesgo, 
      filtroCarrera,
      busqueda
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
      take: parseInt(limite),
      skip: (parseInt(pagina) - 1) * parseInt(limite)
    });

    const totalEstudiantes = await prisma.estudiante.count({
      where: {
        ...filtros,
        usuario: filtroUsuario
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

// GET /api/coordinators/students/:studentId - Detalles de estudiante específico
app.get('/api/coordinators/students/:studentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

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

    // Calcular estadísticas
    const estadisticas = {
      totalEvaluaciones: estudiante.evaluaciones.length,
      frecuenciaEvaluacion: estudiante.evaluaciones.length > 0 ? 
        (estudiante.evaluaciones.length / 4) : 0, // Aproximado por mes
      primerEvaluacion: estudiante.evaluaciones[estudiante.evaluaciones.length - 1]?.fechaEvaluacion,
      ultimaEvaluacion: estudiante.evaluaciones[0]?.fechaEvaluacion
    };

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
      estadisticas,
      analisisTendencia: {
        direccion: 'estable',
        confianza: 75
      }
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
});

// GET /api/coordinators/alerts - Obtener alertas con filtros
app.get('/api/coordinators/alerts', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    const {
      pagina = 1,
      limite = 20,
      severidad,
      leidas = 'false'
    } = req.query;

    const filtros = {};

    if (severidad) {
      filtros.severidad = severidad;
    }

    if (leidas === 'false') {
      filtros.estaLeida = false;
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

    // Calcular tiempo transcurrido
    const calculateTimeElapsed = (fecha) => {
      const ahora = new Date();
      const diferencia = ahora - new Date(fecha);
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      
      if (horas < 1) {
        const minutos = Math.floor(diferencia / (1000 * 60));
        return `hace ${minutos} min`;
      } else if (horas < 24) {
        return `hace ${horas}h`;
      } else {
        const dias = Math.floor(horas / 24);
        return `hace ${dias}d`;
      }
    };

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
      tiempoTranscurrido: calculateTimeElapsed(alerta.fechaCreacion)
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
});

// PUT /api/coordinators/alerts/mark-read - Marcar alertas como leídas
app.put('/api/coordinators/alerts/mark-read', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

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
});

// PUT /api/students/alerts/:alertaId/read - Marcar alerta individual como leída
app.put('/api/students/alerts/:alertaId/read', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a estudiantes'
      });
    }

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
});

// GET /api/coordinators/stats/overview - Estadísticas generales
app.get('/api/coordinators/stats/overview', authenticateToken, async (req, res) => {
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
      where: {
        severidad: 'ALTO',
        fechaCreacion: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const stats = {
      totalEstudiantes,
      distribucionRiesgo: estudiantesPorRiesgo.reduce((acc, item) => {
        acc[item.estadoRiesgo.toLowerCase()] = item._count;
        return acc;
      }, { alto: 0, medio: 0, bajo: 0 }),
      alertasRiesgoAlto,
      tasaRespuestaSemanal: 75, // Placeholder
      promedioEstres: 5.2, // Placeholder
      promedioBurnout: 4.8 // Placeholder
    };
    
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
});

// GET /api/coordinators/stats/trends - Tendencias semanales
app.get('/api/coordinators/stats/trends', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'COORDINADOR') {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido a coordinadores'
      });
    }

    // Placeholder de tendencias
    const trends = [
      {
        semana: '2024-01-01',
        evaluaciones: 15,
        promedioEstres: 5.2,
        promedioBurnout: 4.8
      },
      {
        semana: '2024-01-08',
        evaluaciones: 18,
        promedioEstres: 5.0,
        promedioBurnout: 4.5
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        trends,
        period: '8 semanas'
      }
    });

  } catch (error) {
    console.error('Error obteniendo tendencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== RUTAS BÁSICAS =====

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count();
    const estudiantes = await prisma.estudiante.count();
    const preguntas = await prisma.preguntaEvaluacion.count();
    const recursos = await prisma.recurso.count();
    
    res.json({
      status: 'BD conectada',
      datos: { usuarios, estudiantes, preguntas, recursos },
      message: 'Base de datos funcionando correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error BD',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Endpoint no encontrado:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ DB test: http://localhost:${PORT}/api/db-test`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});