const db = require('../config/database');
const CalculationService = require('../services/calculationService');
const { validationResult } = require('express-validator');

class EvaluationController {
    // Obtener preguntas para evaluación
    static async getQuestions(req, res) {
        try {
            const result = await db.query(`
                SELECT 
                    p.id,
                    p.texto,
                    p.categoria,
                    p.orden,
                    c.nombre as cuestionario_nombre
                FROM preguntas p
                INNER JOIN cuestionarios c ON p.cuestionario_id = c.id
                WHERE p.activo = true AND c.activo = true
                ORDER BY p.orden
            `);

            // Agrupar preguntas por categoría
            const questionsByCategory = result.rows.reduce((acc, question) => {
                if (!acc[question.categoria]) {
                    acc[question.categoria] = [];
                }
                acc[question.categoria].push({
                    id: question.id,
                    texto: question.texto,
                    orden: question.orden
                });
                return acc;
            }, {});

            res.json({
                success: true,
                data: {
                    questions: result.rows,
                    questionsByCategory,
                    totalQuestions: result.rows.length
                }
            });
        } catch (error) {
            console.error('Error al obtener preguntas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener preguntas'
            });
        }
    }

    // Crear nueva evaluación
    static async createEvaluation(req, res) {
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

            const { estudiante_id, respuestas, tiempo_completado } = req.body;

            // Verificar que el estudiante existe
            const studentCheck = await client.query(`
                SELECT id FROM estudiantes WHERE id = $1 AND activo = true
            `, [estudiante_id]);

            if (studentCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Obtener el cuestionario activo
            const cuestionarioResult = await client.query(`
                SELECT id FROM cuestionarios WHERE activo = true LIMIT 1
            `);

            if (cuestionarioResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'No hay cuestionarios activos'
                });
            }

            const cuestionario_id = cuestionarioResult.rows[0].id;

            // Crear la evaluación
            const evaluationResult = await client.query(`
                INSERT INTO evaluaciones (estudiante_id, cuestionario_id, tiempo_completado, completada)
                VALUES ($1, $2, $3, true)
                RETURNING id
            `, [estudiante_id, cuestionario_id, tiempo_completado]);

            const evaluacion_id = evaluationResult.rows[0].id;

            // Insertar respuestas
            for (const respuesta of respuestas) {
                await client.query(`
                    INSERT INTO respuestas (evaluacion_id, pregunta_id, valor)
                    VALUES ($1, $2, $3)
                `, [evaluacion_id, respuesta.pregunta_id, respuesta.valor]);
            }

            // Obtener respuestas con categorías para cálculos
            const responsesWithCategories = await client.query(`
                SELECT r.valor, p.categoria
                FROM respuestas r
                INNER JOIN preguntas p ON r.pregunta_id = p.id
                WHERE r.evaluacion_id = $1
            `, [evaluacion_id]);

            // Calcular puntajes
            const scores = CalculationService.calculateCategoryScores(responsesWithCategories.rows);
            const riskLevel = CalculationService.calculateRiskLevel(scores);
            const promedioGeneral = (scores.estres + scores.agotamiento + scores.sobrecarga + scores.burnout) / 4;

            // Guardar puntajes calculados
            await client.query(`
                INSERT INTO puntajes_calculados (
                    evaluacion_id, estres, agotamiento, sobrecarga, burnout, 
                    promedio_general, nivel_riesgo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                evaluacion_id,
                scores.estres.toFixed(2),
                scores.agotamiento.toFixed(2),
                scores.sobrecarga.toFixed(2),
                scores.burnout.toFixed(2),
                promedioGeneral.toFixed(2),
                riskLevel
            ]);

            // Generar alertas si es necesario
            const alertsNeeded = CalculationService.needsAlert(scores, riskLevel);
            
            for (const alert of alertsNeeded) {
                await client.query(`
                    INSERT INTO alertas (estudiante_id, evaluacion_id, tipo, mensaje, nivel_prioridad)
                    VALUES ($1, $2, $3, $4, $5)
                `, [estudiante_id, evaluacion_id, alert.tipo, alert.mensaje, alert.prioridad]);
            }

            await client.query('COMMIT');

            // Obtener datos completos para la respuesta
            const finalResult = await client.query(`
                SELECT 
                    ev.*,
                    pc.estres,
                    pc.agotamiento,
                    pc.sobrecarga,
                    pc.burnout,
                    pc.promedio_general,
                    pc.nivel_riesgo
                FROM evaluaciones ev
                INNER JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                WHERE ev.id = $1
            `, [evaluacion_id]);

            res.status(201).json({
                success: true,
                data: finalResult.rows[0],
                alertsGenerated: alertsNeeded.length,
                message: 'Evaluación completada exitosamente'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al crear evaluación:', error);
            res.status(500).json({
                success: false,
                error: 'Error al procesar la evaluación'
            });
        } finally {
            client.release();
        }
    }

    // Obtener historial de evaluaciones de un estudiante
    static async getStudentEvaluations(req, res) {
        try {
            const { estudiante_id } = req.params;
            const { limite = 10, pagina = 1 } = req.query;

            const offset = (parseInt(pagina) - 1) * parseInt(limite);

            const result = await db.query(`
                SELECT 
                    ev.*,
                    pc.estres,
                    pc.agotamiento,
                    pc.sobrecarga,
                    pc.burnout,
                    pc.promedio_general,
                    pc.nivel_riesgo,
                    c.nombre as cuestionario_nombre
                FROM evaluaciones ev
                INNER JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                INNER JOIN cuestionarios c ON ev.cuestionario_id = c.id
                WHERE ev.estudiante_id = $1 AND ev.completada = true
                ORDER BY ev.fecha_evaluacion DESC
                LIMIT $2 OFFSET $3
            `, [estudiante_id, limite, offset]);

            // Contar total para paginación
            const countResult = await db.query(`
                SELECT COUNT(*) as total
                FROM evaluaciones
                WHERE estudiante_id = $1 AND completada = true
            `, [estudiante_id]);

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
            console.error('Error al obtener evaluaciones:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener evaluaciones'
            });
        }
    }

    // Obtener última evaluación de un estudiante
    static async getLastEvaluation(req, res) {
        try {
            const { estudiante_id } = req.params;

            const result = await db.query(`
                SELECT 
                    ev.*,
                    pc.estres,
                    pc.agotamiento,
                    pc.sobrecarga,
                    pc.burnout,
                    pc.promedio_general,
                    pc.nivel_riesgo
                FROM evaluaciones ev
                INNER JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
                WHERE ev.estudiante_id = $1 AND ev.completada = true
                ORDER BY ev.fecha_evaluacion DESC
                LIMIT 1
            `, [estudiante_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontraron evaluaciones para este estudiante'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al obtener última evaluación:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener última evaluación'
            });
        }
    }
}

module.exports = EvaluationController;