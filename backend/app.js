// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { pool, testConnection } = require('./config/database');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware de logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📝 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// Configuración CORS actualizada para puerto 5173
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ruta de health check mejorada
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const dbResult = await client.query('SELECT NOW(), version()');
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    client.release();
    
    res.json({
      status: 'OK',
      message: 'Backend funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: {
        status: 'Conectada',
        timestamp: dbResult.rows[0].now,
        version: dbResult.rows[0].version.split(' ')[0] + ' ' + dbResult.rows[0].version.split(' ')[1],
        tables: parseInt(tablesResult.rows[0].table_count)
      },
      server: {
        port: process.env.PORT || 4000,
        node_env: process.env.NODE_ENV || 'development',
        client_url: process.env.CLIENT_URL || 'http://localhost:5174'
      }
    });
  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error de conexión',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para probar CORS
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS funcionando correctamente',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Importar y usar rutas
try {
  const authRoutes = require('./routes/auth');    
  const studentRoutes = require('./routes/students');
  const evaluationRoutes = require('./routes/evaluations');
  const alertRoutes = require('./routes/alerts');
  const resourceRoutes = require('./routes/resources');

  app.use('/api/auth', authRoutes)
  app.use('/api/students', studentRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/resources', resourceRoutes);
  
  console.log('✅ Rutas cargadas correctamente');
} catch (error) {
  console.error('❌ Error cargando rutas:', error.message);
}

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

// Iniciar servidor con verificación de base de datos
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🎉 SERVIDOR INICIADO CORRECTAMENTE');
      console.log('='.repeat(50));
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 CORS permitido: ${process.env.CLIENT_URL || 'http://localhost:5174'}`);
      console.log(`🗄️ Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}`);
      console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;