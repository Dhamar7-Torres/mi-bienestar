import express from 'express';
import AuthController from '../controllers/authController.js';
import { 
  validateLogin, 
  validateStudentRegister, 
  validateCoordinatorRegister, 
  handleValidationErrors 
} from '../utils/validators.js';
import { authenticateToken, logActivity } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - Registro de nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { tipoUsuario } = req.body;

    // Determinar qué validador usar según el tipo de usuario
    let validationRules;
    if (tipoUsuario === 'ESTUDIANTE') {
      validationRules = validateStudentRegister;
    } else if (tipoUsuario === 'COORDINADOR') {
      validationRules = validateCoordinatorRegister;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de usuario inválido. Debe ser ESTUDIANTE o COORDINADOR'
      });
    }

    // Aplicar validaciones
    await Promise.all(validationRules.map(validation => validation.run(req)));
    
    // Verificar errores de validación
    const validationMiddleware = handleValidationErrors(req, res, () => {
      AuthController.register(req, res);
    });

    if (res.headersSent) return;
    validationMiddleware;

  } catch (error) {
    console.error('Error en ruta de registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', validateLogin, handleValidationErrors, (req, res) => {
  AuthController.login(req, res);
});

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', 
  authenticateToken, 
  logActivity('obtener_perfil'),
  (req, res) => {
    AuthController.getProfile(req, res);
  }
);

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', 
  authenticateToken, 
  logActivity('actualizar_perfil'),
  (req, res) => {
    AuthController.updateProfile(req, res);
  }
);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', 
  authenticateToken, 
  logActivity('cambiar_contrasena'),
  (req, res) => {
    AuthController.changePassword(req, res);
  }
);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', 
  authenticateToken, 
  logActivity('cerrar_sesion'),
  (req, res) => {
    AuthController.logout(req, res);
  }
);

// GET /api/auth/verify - Verificar token (útil para el frontend)
router.get('/verify', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token válido',
    data: {
      usuario: {
        id: req.user.id,
        nombreCompleto: req.user.nombreCompleto,
        correo: req.user.correo,
        tipoUsuario: req.user.tipoUsuario
      }
    }
  });
});

export default router;