const db = require('../config/database');
const { validationResult } = require('express-validator');

class ResourceController {
    // Obtener recursos con filtros
    static async getResources(req, res) {
        try {
            const { 
                categoria = null, 
                tipo = null,
                activo = true,
                limite = 20,
                pagina = 1 
            } = req.query;

            let whereConditions = [`activo = $1`];
            let params = [activo];
            let paramIndex = 2;

            if (categoria) {
                whereConditions.push(`categoria = $${paramIndex}`);
                params.push(categoria);
                paramIndex++;
            }

            if (tipo) {
                whereConditions.push(`tipo = $${paramIndex}`);
                params.push(tipo);
                paramIndex++;
            }

            const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
            const offset = (parseInt(pagina) - 1) * parseInt(limite);
            params.push(limite, offset);

            const result = await db.query(`
                SELECT *
                FROM recursos
                ${whereClause}
                ORDER BY fecha_creacion DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, params);

            // Contar total para paginación
            const countParams = params.slice(0, -2);
            const countResult = await db.query(`
                SELECT COUNT(*) as total
                FROM recursos
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
            console.error('Error al obtener recursos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener recursos'
            });
        }
    }

    // Obtener recursos personalizados según nivel de riesgo
    static async getPersonalizedResources(req, res) {
        try {
            const { estudiante_id } = req.params;

            // Obtener última evaluación del estudiante
            const lastEvaluationResult = await db.query(`
                SELECT 
                    pc.estres,
                    pc.agotamiento,
                    pc.sobrecarga,
                    pc.burnout,
                    pc.nivel_riesgo
                FROM evaluaciones ev
                INNER JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                WHERE ev.estudiante_id = $1 AND ev.completada = true
                ORDER BY ev.fecha_evaluacion DESC
                LIMIT 1
            `, [estudiante_id]);

            let resources = [];

            if (lastEvaluationResult.rows.length > 0) {
                const scores = lastEvaluationResult.rows[0];
                
                // Determinar qué categorías necesitan más atención
                const priorityCategories = [];
                
                if (scores.estres >= 6) priorityCategories.push('estres');
                if (scores.agotamiento >= 6) priorityCategories.push('agotamiento');
                if (scores.sobrecarga >= 6) priorityCategories.push('sobrecarga');
                if (scores.burnout >= 6) priorityCategories.push('burnout');

                // Si no hay categorías prioritarias, incluir recursos generales
                if (priorityCategories.length === 0) {
                    priorityCategories.push('general');
                }

                // Obtener recursos para las categorías prioritarias
                const placeholders = priorityCategories.map((_, index) => `$${index + 1}`).join(',');
                
                const resourcesResult = await db.query(`
                    SELECT *
                    FROM recursos
                    WHERE categoria IN (${placeholders}) AND activo = true
                    ORDER BY categoria, fecha_creacion DESC
                `, priorityCategories);

                resources = resourcesResult.rows;
            } else {
                // Si no hay evaluaciones, mostrar recursos generales
                const resourcesResult = await db.query(`
                    SELECT *
                    FROM recursos
                    WHERE categoria = 'general' AND activo = true
                    ORDER BY fecha_creacion DESC
                    LIMIT 10
                `);

                resources = resourcesResult.rows;
            }

            res.json({
                success: true,
                data: resources,
                studentScores: lastEvaluationResult.rows[0] || null
            });
        } catch (error) {
            console.error('Error al obtener recursos personalizados:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener recursos personalizados'
            });
        }
    }

    // Crear nuevo recurso
    static async createResource(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { titulo, descripcion, tipo, duracion, url, categoria } = req.body;

            const result = await db.query(`
                INSERT INTO recursos (titulo, descripcion, tipo, duracion, url, categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [titulo, descripcion, tipo, duracion, url, categoria]);

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Recurso creado exitosamente'
            });
        } catch (error) {
            console.error('Error al crear recurso:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear recurso'
            });
        }
    }
}

module.exports = ResourceController;