const express = require('express');
const AlertController = require('../controllers/alertController');

const router = express.Router();

// Rutas
router.get('/', AlertController.getAllAlerts);
router.get('/stats', AlertController.getAlertStats);
router.patch('/:id/read', AlertController.markAsRead);
router.patch('/read-multiple', AlertController.markMultipleAsRead);

module.exports = router;