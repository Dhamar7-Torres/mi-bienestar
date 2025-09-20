const { validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Errores de validación',
            details: errors.array().map(error => ({
                field: error.path || error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Middleware para sanitizar datos de entrada
const sanitizeInput = (req, res, next) => {
    // Remover campos no deseados del body
    const allowedFields = req.allowedFields || [];
    
    if (allowedFields.length > 0 && req.body) {
        const sanitizedBody = {};
        allowedFields.forEach(field => {
            if (req.body.hasOwnProperty(field)) {
                sanitizedBody[field] = req.body[field];
            }
        });
        req.body = sanitizedBody;
    }

    // Limpiar strings (trim)
    const cleanStrings = (obj) => {
        if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].trim();
                } else if (typeof obj[key] === 'object') {
                    cleanStrings(obj[key]);
                }
            });
        }
    };

    if (req.body) cleanStrings(req.body);
    if (req.query) cleanStrings(req.query);

    next();
};

// Middleware para validar IDs numéricos
const validateNumericId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
            return res.status(400).json({
                success: false,
                error: `ID ${paramName} inválido`
            });
        }
        
        req.params[paramName] = parseInt(id);
        next();
    };
};

// Middleware para validar paginación
const validatePagination = (req, res, next) => {
    const { limite = 20, pagina = 1 } = req.query;
    
    const parsedLimite = parseInt(limite);
    const parsedPagina = parseInt(pagina);
    
    if (isNaN(parsedLimite) || parsedLimite < 1 || parsedLimite > 100) {
        return res.status(400).json({
            success: false,
            error: 'Límite debe estar entre 1 y 100'
        });
    }
    
    if (isNaN(parsedPagina) || parsedPagina < 1) {
        return res.status(400).json({
            success: false,
            error: 'Página debe ser mayor a 0'
        });
    }
    
    req.query.limite = parsedLimite;
    req.query.pagina = parsedPagina;
    
    next();
};

// Middleware para logging de requests
const logRequest = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`📥 ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    // Log response time
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
};

// Middleware para rate limiting básico
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Limpiar requests antiguos
        if (requests.has(ip)) {
            const userRequests = requests.get(ip).filter(time => time > windowStart);
            requests.set(ip, userRequests);
        }
        
        // Verificar límite
        const userRequests = requests.get(ip) || [];
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Demasiadas solicitudes. Intente más tarde.',
                retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
            });
        }
        
        // Agregar request actual
        userRequests.push(now);
        requests.set(ip, userRequests);
        
        next();
    };
};

module.exports = {
    handleValidationErrors,
    sanitizeInput,
    validateNumericId,
    validatePagination,
    logRequest,
    rateLimit
};