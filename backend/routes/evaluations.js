const express = require('express');
const { body } = require('express-validator');
const EvaluationController = require('../controllers/evaluationController');

const router = express.Router();

// Validaciones
const createEvaluationValidation = [
    body('estudiante_id')
        .isInt({ min: 1 })
        .withMessage('ID de estudiante inválido'),
    body('respuestas')
        .isArray({ min: 1 })
        .withMessage('Las respuestas son requeridas'),
    body('respuestas.*.pregunta_id')
        .isInt({ min: 1 })
        .withMessage('ID de pregunta inválido'),
    body('respuestas.*.valor')
        .isInt({ min: 1, max: 10 })
        .withMessage('El valor debe estar entre 1 y 10'),
    body('tiempo_completado')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El tiempo completado debe ser un número positivo')
];

// Rutas
router.get('/questions', EvaluationController.getQuestions);
router.post('/', createEvaluationValidation, EvaluationController.createEvaluation);
router.get('/student/:estudiante_id', EvaluationController.getStudentEvaluations);
router.get('/student/:estudiante_id/last', EvaluationController.getLastEvaluation);

module.exports = router;