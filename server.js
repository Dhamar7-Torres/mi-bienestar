import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './backend/routes/auth.js';
import evaluationRoutes from './backend/routes/evaluations.js';
import studentRoutes from './backend/routes/students.js';
import coordinatorRoutes from './backend/routes/coordinators.js';

// Import utilities
import { prisma } from './backend/utils/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PUERTO || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for development
if (process.env.ENTORNO_NODO === 'desarrollo') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/coordinators', coordinatorRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.ENTORNO_NODO || 'desarrollo'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  
  // Prisma error handling
  if (err.code === 'P2002') {
    return res.status(400).json({ 
      message: 'Ya existe un registro con estos datos únicos',
      error: process.env.ENTORNO_NODO === 'desarrollo' ? err.message : {}
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      message: 'Registro no encontrado',
      error: process.env.ENTORNO_NODO === 'desarrollo' ? err.message : {}
    });
  }
  
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.ENTORNO_NODO === 'desarrollo' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Entorno: ${process.env.ENTORNO_NODO || 'desarrollo'}`);
});

export default app;