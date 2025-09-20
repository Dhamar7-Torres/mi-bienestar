const express = require('express');
const { body } = require('express-validator');
const ResourceController = require('../controllers/resourceController');

const router = express.Router();

// Validaciones
const createResourceValidation = [
    body('titulo')
        .notEmpty()
        .withMessage('El título es requerido')
        .isLength({ min: 2, max: 255 })
        .withMessage('El título debe tener entre 2 y 255 caracteres'),
    body('tipo')
        .isIn(['video', 'articulo', 'audio', 'documento', 'herramienta'])
        .withMessage('Tipo de recurso inválido'),
    body('categoria')
        .isIn(['estres', 'agotamiento', 'sobrecarga', 'burnout', 'general'])
        .withMessage('Categoría inválida'),
    body('url')
        .optional()
        .isURL()
        .withMessage('URL inválida'),
    body('duracion')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La duración debe ser un número positivo')
];

// Rutas
router.get('/', ResourceController.getResources);
router.get('/personalized/:estudiante_id', ResourceController.getPersonalizedResources);
router.post('/', createResourceValidation, ResourceController.createResource);

module.exports = router;