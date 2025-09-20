import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

// Middleware principal de autenticación
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRETO);
    
    // Buscar usuario en base de datos
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

    // Agregar información del usuario al request
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
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar tipo de usuario
export const requireUserType = (tipoUsuario) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (req.user.tipoUsuario !== tipoUsuario) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido a usuarios de tipo ${tipoUsuario}`
      });
    }

    next();
  };
};

// Middleware específico para estudiantes
export const requireStudent = requireUserType('ESTUDIANTE');

// Middleware específico para coordinadores
export const requireCoordinator = requireUserType('COORDINADOR');

// Middleware para verificar acceso a estudiante específico
export const requireStudentAccess = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'ID de estudiante requerido'
      });
    }

    // Si es coordinador, puede acceder a cualquier estudiante
    if (req.user.tipoUsuario === 'COORDINADOR') {
      return next();
    }

    // Si es estudiante, solo puede acceder a sus propios datos
    if (req.user.tipoUsuario === 'ESTUDIANTE') {
      if (req.user.estudiante && req.user.estudiante.id === parseInt(studentId)) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a estos datos'
        });
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Tipo de usuario no autorizado'
    });

  } catch (error) {
    console.error('Error verificando acceso a estudiante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRETO);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: {
        estudiante: true,
        coordinador: true
      }
    });

    req.user = usuario ? {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario,
      estudiante: usuario.estudiante,
      coordinador: usuario.coordinador
    } : null;

    next();
  } catch (error) {
    // En caso de error, continuar sin usuario autenticado
    req.user = null;
    next();
  }
};

// Middleware para logging de actividad
export const logActivity = (action) => {
  return (req, res, next) => {
    const timestamp = new Date().toISOString();
    const userId = req.user?.id || 'anonymous';
    const userType = req.user?.tipoUsuario || 'unknown';
    
    console.log(`[${timestamp}] Usuario ${userId} (${userType}) realizó: ${action}`);
    
    // En producción, esto debería guardarse en base de datos
    // await prisma.activityLog.create({
    //   data: {
    //     userId: req.user?.id,
    //     action,
    //     timestamp: new Date(),
    //     metadata: {
    //       ip: req.ip,
    //       userAgent: req.headers['user-agent']
    //     }
    //   }
    // });

    next();
  };
};

// Middleware para verificar límites de evaluación
export const checkEvaluationLimits = async (req, res, next) => {
  try {
    if (req.user.tipoUsuario !== 'ESTUDIANTE') {
      return next();
    }

    const estudianteId = req.user.estudiante.id;
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    // Verificar evaluaciones de esta semana
    const evaluacionesSemana = await prisma.evaluacion.count({
      where: {
        estudianteId,
        fechaEvaluacion: {
          gte: inicioSemana
        }
      }
    });

    if (evaluacionesSemana >= 2) { // Máximo 2 evaluaciones por semana
      return res.status(429).json({
        success: false,
        message: 'Has alcanzado el límite de evaluaciones por semana (2)',
        nextEvaluationDate: new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando límites de evaluación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};