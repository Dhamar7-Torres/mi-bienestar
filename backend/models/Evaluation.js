const db = require('../config/database');

class Evaluation {
    constructor(data) {
        this.id = data.id;
        this.estudiante_id = data.estudiante_id;
        this.cuestionario_id = data.cuestionario_id;
        this.fecha_evaluacion = data.fecha_evaluacion;
        this.completada = data.completada;
        this.tiempo_completado = data.tiempo_completado;
        this.created_at = data.created_at;
    }

    // Crear nueva evaluación
    static async create(evaluationData) {
        const { estudiante_id, cuestionario_id, tiempo_completado } = evaluationData;
        
        const result = await db.query(`
            INSERT INTO evaluaciones (estudiante_id, cuestionario_id, tiempo_completado, completada)
            VALUES ($1, $2, $3, false)
            RETURNING *
        `, [estudiante_id, cuestionario_id, tiempo_completado]);

        return new Evaluation(result.rows[0]);
    }

    // Buscar por ID
    static async findById(id) {
        const result = await db.query(`
            SELECT * FROM evaluaciones WHERE id = $1
        `, [id]);

        return result.rows.length > 0 ? new Evaluation(result.rows[0]) : null;
    }

    // Buscar evaluaciones de un estudiante
    static async findByStudent(studentId, limit = 10, offset = 0) {
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
            LEFT JOIN puntajes_calculados pc ON ev.id = pc.evaluacion_id
            LEFT JOIN cuestionarios c ON ev.cuestionario_id = c.id
            WHERE ev.estudiante_id = $1
            ORDER BY ev.fecha_evaluacion DESC
            LIMIT $2 OFFSET $3
        `, [studentId, limit, offset]);

        return result.rows.map(row => ({
            ...new Evaluation(row),
            scores: {
                estres: row.estres ? parseFloat(row.estres) : null,
                agotamiento: row.agotamiento ? parseFloat(row.agotamiento) : null,
                sobrecarga: row.sobrecarga ? parseFloat(row.sobrecarga) : null,
                burnout: row.burnout ? parseFloat(row.burnout) : null,
                promedio_general: row.promedio_general ? parseFloat(row.promedio_general) : null,
                nivel_riesgo: row.nivel_riesgo
            },
            cuestionario_nombre: row.cuestionario_nombre
        }));
    }

    // Obtener última evaluación de un estudiante
    static async findLastByStudent(studentId) {
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
        `, [studentId]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            ...new Evaluation(row),
            scores: {
                estres: parseFloat(row.estres),
                agotamiento: parseFloat(row.agotamiento),
                sobrecarga: parseFloat(row.sobrecarga),
                burnout: parseFloat(row.burnout),
                promedio_general: parseFloat(row.promedio_general),
                nivel_riesgo: row.nivel_riesgo
            }
        };
    }

    // Agregar respuestas a la evaluación
    async addResponses(responses) {
        const client = await db.pool.connect();
        
        try {
            await client.query('BEGIN');

            for (const response of responses) {
                await client.query(`
                    INSERT INTO respuestas (evaluacion_id, pregunta_id, valor)
                    VALUES ($1, $2, $3)
                `, [this.id, response.pregunta_id, response.valor]);
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Marcar como completada
    async markAsCompleted() {
        const result = await db.query(`
            UPDATE evaluaciones 
            SET completada = true
            WHERE id = $1
            RETURNING *
        `, [this.id]);

        if (result.rows.length > 0) {
            this.completada = true;
        }

        return this;
    }

    // Obtener respuestas de la evaluación
    async getResponses() {
        const result = await db.query(`
            SELECT 
                r.*,
                p.texto as pregunta_texto,
                p.categoria
            FROM respuestas r
            INNER JOIN preguntas p ON r.pregunta_id = p.id
            WHERE r.evaluacion_id = $1
            ORDER BY p.orden
        `, [this.id]);

        return result.rows;
    }

    // Serializar para JSON
    toJSON() {
        return {
            id: this.id,
            estudiante_id: this.estudiante_id,
            cuestionario_id: this.cuestionario_id,
            fecha_evaluacion: this.fecha_evaluacion,
            completada: this.completada,
            tiempo_completado: this.tiempo_completado,
            created_at: this.created_at
        };
    }
}

module.exports = Evaluation;