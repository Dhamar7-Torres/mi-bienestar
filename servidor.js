const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;  // <-- TU VARIABLE CORRECTA

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

// Rutas básicas de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente',
    environment: process.env.NODE_ENV || 'development'  // <-- TU VARIABLE CORRECTA
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando',
    frontend: 'http://localhost:5173',
    backend: `http://localhost:${PORT}`,
    environment: process.env.NODE_ENV,
    database: 'Connected to PostgreSQL'
  });
});

// Endpoint para probar BD
app.get('/api/db-test', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const usuarios = await prisma.usuario.count();
    const estudiantes = await prisma.estudiante.count();
    
    res.json({
      status: 'BD conectada',
      usuarios,
      estudiantes,
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
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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