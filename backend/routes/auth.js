const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
    body('nombre')
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
        .isIn(['student', 'admin'])
        .withMessage('Rol inválido'),
    // Validaciones condicionales según el rol
    body('carrera')
        .if(body('role').equals('student'))
        .notEmpty()
        .withMessage('La carrera es requerida para estudiantes')
        .isLength({ min: 2, max: 255 })
        .withMessage('La carrera debe tener entre 2 y 255 caracteres'),
    body('semestre')
        .if(body('role').equals('student'))
        .isInt({ min: 1, max: 12 })
        .withMessage('El semestre debe ser un número entre 1 y 12'),
    body('departamento')
        .if(body('role').equals('admin'))
        .notEmpty()
        .withMessage('El departamento es requerido para administradores')
        .isLength({ min: 2, max: 255 })
        .withMessage('El departamento debe tener entre 2 y 255 caracteres')
];

// Validaciones para login
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

// Rutas
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.get('/verify', authenticateToken, AuthController.verifyToken);
router.post('/logout', AuthController.logout);

module.exports = router;