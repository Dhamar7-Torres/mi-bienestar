const db = require('../config/database');
const { validationResult } = require('express-validator');

class StudentController {
    // Obtener todos los estudiantes
    static async getAllStudents(req, res) {
        try {
            const result = await db.query(`
                SELECT 
                    e.*,
                    COUNT(ev.id) as total_evaluaciones,
                    MAX(pc.promedio_general) as ultimo_promedio,
                    MAX(pc.nivel_riesgo) as nivel_riesgo_actual,
                    COUNT(CASE WHEN a.leida = false THEN 1 END) as alertas_pendientes
                FROM estudiantes e
                LEFT JOIN evaluaciones ev ON e.id = ev.estudiante_id AND ev.completada = true
                LEFT JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                LEFT JOIN alertas a ON e.id = a.estudiante_id
                WHERE e.activo = true
                GROUP BY e.id
                ORDER BY e.nombre
            `);

            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length
            });
        } catch (error) {
            console.error('Error al obtener estudiantes:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estudiantes'
            });
        }
    }

    // Obtener estudiante por ID con detalles completos
    static async getStudentById(req, res) {
        try {
            const { id } = req.params;

            // Información básica del estudiante
            const studentResult = await db.query(`
                SELECT * FROM estudiantes WHERE id = $1 AND activo = true
            `, [id]);

            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            const student = studentResult.rows[0];

            // Historial de evaluaciones
            const evaluationsResult = await db.query(`
                SELECT 
                    ev.*,
                    pc.estres,
                    pc.agotamiento,
                    pc.sobrecarga,
                    pc.burnout,
                    pc.promedio_general,
                    pc.nivel_riesgo
                FROM evaluaciones ev
                LEFT JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                WHERE ev.estudiante_id = $1 AND ev.completada = true
                ORDER BY ev.fecha_evaluacion DESC
                LIMIT 10
            `, [id]);

            // Alertas recientes
            const alertsResult = await db.query(`
                SELECT * FROM alertas 
                WHERE estudiante_id = $1 
                ORDER BY fecha_alerta DESC 
                LIMIT 5
            `, [id]);

            res.json({
                success: true,
                data: {
                    student,
                    evaluations: evaluationsResult.rows,
                    alerts: alertsResult.rows
                }
            });
        } catch (error) {
            console.error('Error al obtener estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estudiante'
            });
        }
    }

    // Crear nuevo estudiante
    static async createStudent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { nombre, email, carrera, semestre } = req.body;

            const result = await db.query(`
                INSERT INTO estudiantes (nombre, email, carrera, semestre)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [nombre, email, carrera, semestre]);

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Estudiante creado exitosamente'
            });
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }
            
            console.error('Error al crear estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear estudiante'
            });
        }
    }

    // Obtener estadísticas generales
    static async getGeneralStats(req, res) {
        try {
            // Total de estudiantes activos
            const totalStudentsResult = await db.query(`
                SELECT COUNT(*) as total FROM estudiantes WHERE activo = true
            `);

            // Alertas activas (no leídas)
            const activeAlertsResult = await db.query(`
                SELECT COUNT(*) as total FROM alertas WHERE leida = false
            `);

            // Tasa de respuesta (evaluaciones completadas vs estudiantes)
            const responseRateResult = await db.query(`
                SELECT 
                    COUNT(DISTINCT e.id) as estudiantes_evaluados,
                    COUNT(*) as total_evaluaciones
                FROM evaluaciones e
                WHERE e.completada = true 
                    AND e.fecha_evaluacion >= CURRENT_DATE - INTERVAL '7 days'
            `);

            // Distribución de niveles de riesgo
            const riskDistributionResult = await db.query(`
                SELECT 
                    pc.nivel_riesgo,
                    COUNT(*) as cantidad
                FROM puntajes_calculados pc
                INNER JOIN evaluaciones ev ON pc.evaluacion_id = ev.id
                WHERE ev.fecha_evaluacion >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY pc.nivel_riesgo
            `);

            const totalStudents = parseInt(totalStudentsResult.rows[0].total);
            const estudiantesEvaluados = parseInt(responseRateResult.rows[0].estudiantes_evaluados);
            const tasaRespuesta = totalStudents > 0 ? (estudiantesEvaluados / totalStudents * 100).toFixed(1) : 0;

            res.json({
                success: true,
                data: {
                    totalEstudiantes: totalStudents,
                    alertasActivas: parseInt(activeAlertsResult.rows[0].total),
                    tasaRespuesta: `${tasaRespuesta}%`,
                    distribucionRiesgo: riskDistributionResult.rows.reduce((acc, row) => {
                        acc[row.nivel_riesgo] = parseInt(row.cantidad);
                        return acc;
                    }, { BAJO: 0, MEDIO: 0, ALTO: 0 }),
                    totalEvaluaciones: parseInt(responseRateResult.rows[0].total_evaluaciones)
                }
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }
}

module.exports = StudentController;