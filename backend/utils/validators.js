import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validadores para autenticación
export const validateLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un correo electrónico válido'),
  body('contrasena')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

export const validateRegister = [
  body('nombreCompleto')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre completo debe tener entre 2 y 255 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un correo electrónico válido'),
  body('contrasena')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('tipoUsuario')
    .isIn(['ESTUDIANTE', 'COORDINADOR'])
    .withMessage('El tipo de usuario debe ser ESTUDIANTE o COORDINADOR')
];

// Validadores específicos para estudiantes
export const validateStudentRegister = [
  ...validateRegister,
  body('carrera')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('La carrera debe tener entre 3 y 255 caracteres'),
  body('semestre')
    .isInt({ min: 1, max: 12 })
    .withMessage('El semestre debe ser un número entre 1 y 12')
];

// Validadores específicos para coordinadores
export const validateCoordinatorRegister = [
  ...validateRegister,
  body('departamento')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('El departamento debe tener entre 5 y 255 caracteres')
];

// Validadores para evaluaciones
export const validateEvaluation = [
  body('respuestasEstres')
    .isArray({ min: 1, max: 20 })
    .withMessage('Las respuestas de estrés deben ser un array de 1 a 20 elementos'),
  body('respuestasEstres.*')
    .isInt({ min: 0, max: 4 })
    .withMessage('Cada respuesta de estrés debe ser un número entre 0 y 4'),
  body('respuestasBurnout')
    .isArray({ min: 1, max: 20 })
    .withMessage('Las respuestas de burnout deben ser un array de 1 a 20 elementos'),
  body('respuestasBurnout.*')
    .isInt({ min: 0, max: 4 })
    .withMessage('Cada respuesta de burnout debe ser un número entre 0 y 4')
];

// Utilidades para autenticación
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateJWT = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRETO,
    { 
      expiresIn: '7d',
      issuer: 'psychosocial-risk-app',
      audience: 'psychosocial-risk-users'
    }
  );
};

export const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRETO);
};

// Validador de archivos (para futuras funcionalidades)
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y GIF'
    });
  }
  
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB'
    });
  }
  
  next();
};

// Sanitizar datos de entrada
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
    .substring(0, 1000); // Limitar longitud
};

// Validar formato de fecha
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validar rango de fechas
export const isDateInRange = (date, minDays = 0, maxDays = 365) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = Math.abs(targetDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= minDays && diffDays <= maxDays;
};

// Validadores adicionales para coordinadores
export const validateReportRequest = [
  body('fechaInicio')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe estar en formato ISO 8601'),
  body('fechaFin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe estar en formato ISO 8601'),
  body('incluirDetalles')
    .optional()
    .isBoolean()
    .withMessage('incluirDetalles debe ser un booleano')
];

// Validador para IDs
export const validateId = (fieldName = 'id') => [
  body(fieldName)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} debe ser un número entero positivo`)
];

// Validador para arrays de IDs
export const validateIdArray = (fieldName = 'ids') => [
  body(fieldName)
    .isArray({ min: 1 })
    .withMessage(`${fieldName} debe ser un array con al menos un elemento`),
  body(`${fieldName}.*`)
    .isInt({ min: 1 })
    .withMessage(`Cada elemento de ${fieldName} debe ser un número entero positivo`)
];

// Validador para parámetros de consulta comunes
export const validateQueryParams = (req, res, next) => {
  const { pagina, limite } = req.query;
  
  if (pagina && (!Number.isInteger(Number(pagina)) || Number(pagina) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro pagina debe ser un número entero positivo'
    });
  }
  
  if (limite && (!Number.isInteger(Number(limite)) || Number(limite) < 1 || Number(limite) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro limite debe ser un número entre 1 y 100'
    });
  }
  
  next();
};

// Validador para filtros de estudiantes
export const validateStudentFilters = (req, res, next) => {
  const { filtroRiesgo, ordenarPor, orden } = req.query;
  
  if (filtroRiesgo && !['BAJO', 'MEDIO', 'ALTO'].includes(filtroRiesgo)) {
    return res.status(400).json({
      success: false,
      message: 'filtroRiesgo debe ser BAJO, MEDIO o ALTO'
    });
  }
  
  const camposValidosOrden = ['nombreCompleto', 'carrera', 'semestre', 'estadoRiesgo', 'fechaUltimaEvaluacion'];
  if (ordenarPor && !camposValidosOrden.includes(ordenarPor)) {
    return res.status(400).json({
      success: false,
      message: `ordenarPor debe ser uno de: ${camposValidosOrden.join(', ')}`
    });
  }
  
  if (orden && !['asc', 'desc'].includes(orden)) {
    return res.status(400).json({
      success: false,
      message: 'orden debe ser asc o desc'
    });
  }
  
  next();
};

// Validador para filtros de alertas
export const validateAlertFilters = (req, res, next) => {
  const { severidad, leidas, fechaDesde, fechaHasta } = req.query;
  
  if (severidad && !['BAJO', 'MEDIO', 'ALTO'].includes(severidad)) {
    return res.status(400).json({
      success: false,
      message: 'severidad debe ser BAJO, MEDIO o ALTO'
    });
  }
  
  if (leidas && !['true', 'false'].includes(leidas)) {
    return res.status(400).json({
      success: false,
      message: 'leidas debe ser true o false'
    });
  }
  
  if (fechaDesde && !isValidDate(fechaDesde)) {
    return res.status(400).json({
      success: false,
      message: 'fechaDesde debe ser una fecha válida'
    });
  }
  
  if (fechaHasta && !isValidDate(fechaHasta)) {
    return res.status(400).json({
      success: false,
      message: 'fechaHasta debe ser una fecha válida'
    });
  }
  
  if (fechaDesde && fechaHasta && new Date(fechaDesde) > new Date(fechaHasta)) {
    return res.status(400).json({
      success: false,
      message: 'fechaDesde no puede ser posterior a fechaHasta'
    });
  }
  
  next();
};

// Validador de contraseña fuerte (opcional)
export const validateStrongPassword = [
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial')
];

// Utilidad para validar correos institucionales
export const validateInstitutionalEmail = (email, institutionalDomain = 'universidad.edu') => {
  return email.endsWith(`@${institutionalDomain}`);
};

// Middleware para validar correo institucional
export const requireInstitutionalEmail = (req, res, next) => {
  const { correo } = req.body;
  
  if (!validateInstitutionalEmail(correo)) {
    return res.status(400).json({
      success: false,
      message: 'Debe usar un correo institucional válido (@universidad.edu)'
    });
  }
  
  next();
};

// Utilidad para generar token de verificación
export const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validador para tokens de verificación
export const validateVerificationToken = [
  body('token')
    .isLength({ min: 20, max: 50 })
    .withMessage('Token de verificación inválido')
];

export default {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateStudentRegister,
  validateCoordinatorRegister,
  validateEvaluation,
  hashPassword,
  comparePassword,
  generateJWT,
  verifyJWT,
  validateFileUpload,
  sanitizeInput,
  isValidDate,
  isDateInRange,
  validateReportRequest,
  validateId,
  validateIdArray,
  validateQueryParams,
  validateStudentFilters,
  validateAlertFilters,
  validateStrongPassword,
  validateInstitutionalEmail,
  requireInstitutionalEmail,
  generateVerificationToken,
  validateVerificationToken
};