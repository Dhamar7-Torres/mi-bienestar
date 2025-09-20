const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
    // Registrar nuevo usuario
    static async register(req, res) {
        const client = await db.pool.connect();
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            await client.query('BEGIN');

            const { nombre, email, password, role, carrera, semestre, departamento } = req.body;

            // Verificar si el email ya existe
            const existingUser = await client.query(`
                SELECT email FROM usuarios WHERE email = $1
                UNION
                SELECT email FROM estudiantes WHERE email = $1
            `, [email]);

            if (existingUser.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }

            // Hash de la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            let userId;
            let userData;

            if (role === 'student') {
                // Crear estudiante
                const studentResult = await client.query(`
                    INSERT INTO estudiantes (nombre, email, password, carrera, semestre)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, nombre, email, carrera, semestre, fecha_registro
                `, [nombre, email, hashedPassword, carrera, semestre]);

                userId = studentResult.rows[0].id;
                userData = {
                    id: userId,
                    nombre: studentResult.rows[0].nombre,
                    email: studentResult.rows[0].email,
                    carrera: studentResult.rows[0].carrera,
                    semestre: studentResult.rows[0].semestre,
                    role: 'student',
                    fecha_registro: studentResult.rows[0].fecha_registro
                };
            } else if (role === 'admin') {
                // Crear usuario administrador
                const adminResult = await client.query(`
                    INSERT INTO usuarios (nombre, email, password, role, departamento)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, nombre, email, role, departamento, created_at
                `, [nombre, email, hashedPassword, 'admin', departamento]);

                userId = adminResult.rows[0].id;
                userData = {
                    id: userId,
                    nombre: adminResult.rows[0].nombre,
                    email: adminResult.rows[0].email,
                    role: adminResult.rows[0].role,
                    departamento: adminResult.rows[0].departamento,
                    created_at: adminResult.rows[0].created_at
                };
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Rol de usuario inválido'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                { userId, email, role },
                process.env.JWT_SECRET || 'mi_bienestar_secret_key',
                { expiresIn: '24h' }
            );

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    user: userData,
                    token
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        } finally {
            client.release();
        }
    }

    // Iniciar sesión
    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Buscar usuario en ambas tablas
            let userResult;
            let role;

            // Primero buscar en estudiantes
            userResult = await db.query(`
                SELECT id, nombre, email, password, carrera, semestre, 'student' as role
                FROM estudiantes 
                WHERE email = $1 AND activo = true
            `, [email]);

            if (userResult.rows.length === 0) {
                // Si no es estudiante, buscar en usuarios (admin)
                userResult = await db.query(`
                    SELECT id, nombre, email, password, role, departamento
                    FROM usuarios 
                    WHERE email = $1 AND activo = true
                `, [email]);
            }

            if (userResult.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas'
                });
            }

            const user = userResult.rows[0];

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'mi_bienestar_secret_key',
                { expiresIn: '24h' }
            );

            // Preparar datos del usuario (sin password)
            const userData = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.role
            };

            if (user.role === 'student') {
                userData.carrera = user.carrera;
                userData.semestre = user.semestre;
            } else {
                userData.departamento = user.departamento;
            }

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    user: userData,
                    token
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // Verificar token
    static async verifyToken(req, res) {
        try {
            const user = req.user; // Viene del middleware de autenticación
            
            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Error al verificar token:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // Cerrar sesión (opcional, principalmente para limpiar tokens del lado cliente)
    static async logout(req, res) {
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    }
}

module.exports = AuthController;