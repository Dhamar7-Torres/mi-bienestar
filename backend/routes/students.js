const express = require('express');
const { body } = require('express-validator');
const StudentController = require('../controllers/studentController');

const router = express.Router();

// Validaciones
const createStudentValidation = [
    body('nombre')
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('carrera')
        .notEmpty()
        .withMessage('La carrera es requerida')
        .isLength({ min: 2, max: 255 })
        .withMessage('La carrera debe tener entre 2 y 255 caracteres'),
    body('semestre')
        .isInt({ min: 1, max: 12 })
        .withMessage('El semestre debe ser un número entre 1 y 12')
];

// Rutas
router.get('/', StudentController.getAllStudents);
router.get('/stats', StudentController.getGeneralStats);
router.get('/:id', StudentController.getStudentById);
router.post('/', createStudentValidation, StudentController.createStudent);

module.exports = router;