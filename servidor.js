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

// ===== RUTAS DE AUTENTICACIÓN =====

// POST /api/auth/register - Registro de usuarios
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

    console.log('✅ Usuario creado:', nuevoUsuario.id);

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
      console.log('✅ Perfil de estudiante creado');
    } else if (tipoUsuario === 'COORDINADOR') {
      perfilEspecifico = await prisma.coordinador.create({
        data: {
          usuarioId: nuevoUsuario.id,
          departamento
        }
      });
      console.log('✅ Perfil de coordinador creado');
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
          perfil: perfilEspecifico
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

// POST /api/auth/login - Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    console.log('🔑 Intento de login:', correo);

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

    console.log('✅ Login exitoso para:', correo);

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
      message: 'Error interno del servidor durante el inicio de sesión'
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

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando',
    frontend: 'http://localhost:5173',
    backend: `http://localhost:${PORT}`,
    environment: process.env.NODE_ENV
  });
});

// Endpoint para probar BD
app.get('/api/db-test', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count();
    const estudiantes = await prisma.estudiante.count();
    const preguntas = await prisma.preguntaEvaluacion.count();
    
    res.json({
      status: 'BD conectada',
      datos: {
        usuarios,
        estudiantes,
        preguntas
      },
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

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ DB test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});