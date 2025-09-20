const db = require('../config/database');
const { validationResult } = require('express-validator');

class AlertController {
    // Obtener todas las alertas con filtros
    static async getAllAlerts(req, res) {
        try {
            const { 
                leida = null, 
                nivel_prioridad = null, 
                estudiante_id = null,
                limite = 50,
                pagina = 1 
            } = req.query;

            let whereConditions = [];
            let params = [];
            let paramIndex = 1;

            // Construir condiciones WHERE dinámicamente
            if (leida !== null) {
                whereConditions.push(`a.leida = $${paramIndex}`);
                params.push(leida === 'true');
                paramIndex++;
            }

            if (nivel_prioridad) {
                whereConditions.push(`a.nivel_prioridad = $${paramIndex}`);
                params.push(nivel_prioridad);
                paramIndex++;
            }

            if (estudiante_id) {
                whereConditions.push(`a.estudiante_id = $${paramIndex}`);
                params.push(estudiante_id);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Agregar límite y offset
            const offset = (parseInt(pagina) - 1) * parseInt(limite);
            params.push(limite, offset);

            const result = await db.query(`
                SELECT 
                    a.*,
                    e.nombre as estudiante_nombre,
                    e.email as estudiante_email,
                    e.carrera as estudiante_carrera,
                    pc.nivel_riesgo,
                    pc.promedio_general
                FROM alertas a
                INNER JOIN estudiantes e ON a.estudiante_id = e.id
                LEFT JOIN evaluaciones ev ON a.evaluacion_id = ev.id
                LEFT JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                ${whereClause}
                ORDER BY 
                    CASE a.nivel_prioridad 
                        WHEN 'CRITICA' THEN 1
                        WHEN 'ALTA' THEN 2

                        WHEN 'MEDIA' THEN 3
                        WHEN 'BAJA' THEN 4
                    END,
                    a.fecha_alerta DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, params);

            // Contar total para paginación
            const countParams = params.slice(0, -2); // Remover limite y offset
            const countResult = await db.query(`
                SELECT COUNT(*) as total
                FROM alertas a
                INNER JOIN estudiantes e ON a.estudiante_id = e.id
                ${whereClause}
            `, countParams);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].total),
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(countResult.rows[0].total / limite)
                }
            });
        } catch (error) {
            console.error('Error al obtener alertas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener alertas'
            });
        }
    }

    // Marcar alerta como leída
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(`
                UPDATE alertas 
                SET leida = true, fecha_leida = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Alerta no encontrada'
                });
            }

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Alerta marcada como leída'
            });
        } catch (error) {
            console.error('Error al marcar alerta:', error);
            res.status(500).json({
                success: false,
                error: 'Error al marcar alerta como leída'
            });
        }
    }

    // Marcar múltiples alertas como leídas
    static async markMultipleAsRead(req, res) {
        try {
            const { alertIds } = req.body;

            if (!Array.isArray(alertIds) || alertIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de IDs de alertas'
                });
            }

            const placeholders = alertIds.map((_, index) => `$${index + 1}`).join(',');
            
            const result = await db.query(`
                UPDATE alertas 
                SET leida = true, fecha_leida = CURRENT_TIMESTAMP
                WHERE id IN (${placeholders})
                RETURNING id
            `, alertIds);

            res.json({
                success: true,
                data: { updatedCount: result.rows.length },
                message: `${result.rows.length} alertas marcadas como leídas`
            });
        } catch (error) {
            console.error('Error al marcar múltiples alertas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al marcar alertas como leídas'
            });
        }
    }

    // Obtener estadísticas de alertas
    static async getAlertStats(req, res) {
        try {
            // Alertas por prioridad
            const priorityStatsResult = await db.query(`
                SELECT 
                    nivel_prioridad,
                    COUNT(*) as cantidad,
                    COUNT(CASE WHEN leida = false THEN 1 END) as no_leidas
                FROM alertas
                WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY nivel_prioridad
                ORDER BY 
                    CASE nivel_prioridad 
                        WHEN 'CRITICA' THEN 1
                        WHEN 'ALTA' THEN 2
                        WHEN 'MEDIA' THEN 3
                        WHEN 'BAJA' THEN 4
                    END
            `);

            // Alertas por tipo
            const typeStatsResult = await db.query(`
                SELECT 
                    tipo,
                    COUNT(*) as cantidad
                FROM alertas
                WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY tipo
                ORDER BY cantidad DESC
            `);

            // Tendencia semanal
            const weeklyTrendResult = await db.query(`
                SELECT 
                    DATE(fecha_alerta) as fecha,
                    COUNT(*) as cantidad
                FROM alertas
                WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY DATE(fecha_alerta)
                ORDER BY fecha
            `);

            res.json({
                success: true,
                data: {
                    porPrioridad: priorityStatsResult.rows,
                    porTipo: typeStatsResult.rows,
                    tendenciaSemanal: weeklyTrendResult.rows
                }
            });
        } catch (error) {
            console.error('Error al obtener estadísticas de alertas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas de alertas'
            });
        }
    }
}

module.exports = AlertController;