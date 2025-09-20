const db = require('../config/database');

class Alert {
    constructor(data) {
        this.id = data.id;
        this.estudiante_id = data.estudiante_id;
        this.evaluacion_id = data.evaluacion_id;
        this.tipo = data.tipo;
        this.mensaje = data.mensaje;
        this.nivel_prioridad = data.nivel_prioridad;
        this.leida = data.leida;
        this.fecha_alerta = data.fecha_alerta;
        this.fecha_leida = data.fecha_leida;
    }

    // Crear nueva alerta
    static async create(alertData) {
        const { estudiante_id, evaluacion_id, tipo, mensaje, nivel_prioridad } = alertData;
        
        const result = await db.query(`
            INSERT INTO alertas (estudiante_id, evaluacion_id, tipo, mensaje, nivel_prioridad)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [estudiante_id, evaluacion_id, tipo, mensaje, nivel_prioridad]);

        return new Alert(result.rows[0]);
    }

    // Buscar por ID
    static async findById(id) {
        const result = await db.query(`
            SELECT * FROM alertas WHERE id = $1
        `, [id]);

        return result.rows.length > 0 ? new Alert(result.rows[0]) : null;
    }

    // Buscar todas las alertas con filtros
    static async findAll(filters = {}, limit = 50, offset = 0) {
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Aplicar filtros
        if (filters.leida !== undefined) {
            whereConditions.push(`a.leida = $${paramIndex}`);
            params.push(filters.leida);
            paramIndex++;
        }

        if (filters.nivel_prioridad) {
            whereConditions.push(`a.nivel_prioridad = $${paramIndex}`);
            params.push(filters.nivel_prioridad);
            paramIndex++;
        }

        if (filters.estudiante_id) {
            whereConditions.push(`a.estudiante_id = $${paramIndex}`);
            params.push(filters.estudiante_id);
            paramIndex++;
        }

        if (filters.fecha_desde) {
            whereConditions.push(`a.fecha_alerta >= $${paramIndex}`);
            params.push(filters.fecha_desde);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        params.push(limit, offset);

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

        return result.rows.map(row => ({
            ...new Alert(row),
            estudiante_nombre: row.estudiante_nombre,
            estudiante_email: row.estudiante_email,
            estudiante_carrera: row.estudiante_carrera,
            nivel_riesgo: row.nivel_riesgo,
            promedio_general: row.promedio_general ? parseFloat(row.promedio_general) : null
        }));
    }

    // Buscar alertas por estudiante
    static async findByStudent(studentId, includeRead = false, limit = 10) {
        let whereClause = 'WHERE estudiante_id = $1';
        const params = [studentId];

        if (!includeRead) {
            whereClause += ' AND leida = false';
        }

        params.push(limit);

        const result = await db.query(`
            SELECT * FROM alertas 
            ${whereClause}
            ORDER BY fecha_alerta DESC
            LIMIT $${params.length}
        `, params);

        return result.rows.map(row => new Alert(row));
    }

    // Marcar como leída
    async markAsRead() {
        const result = await db.query(`
            UPDATE alertas 
            SET leida = true, fecha_leida = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [this.id]);

        if (result.rows.length > 0) {
            this.leida = true;
            this.fecha_leida = result.rows[0].fecha_leida;
        }

        return this;
    }

    // Marcar múltiples alertas como leídas
    static async markMultipleAsRead(alertIds) {
        if (!Array.isArray(alertIds) || alertIds.length === 0) {
            throw new Error('Se requiere un array de IDs válido');
        }

        const placeholders = alertIds.map((_, index) => `$${index + 1}`).join(',');
        
        const result = await db.query(`
            UPDATE alertas 
            SET leida = true, fecha_leida = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders})
            RETURNING id
        `, alertIds);

        return result.rows.length;
    }

    // Obtener estadísticas de alertas
    static async getStats(dias = 30) {
        // Estadísticas por prioridad
        const priorityStats = await db.query(`
            SELECT 
                nivel_prioridad,
                COUNT(*) as cantidad,
                COUNT(CASE WHEN leida = false THEN 1 END) as no_leidas
            FROM alertas
            WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '${dias} days'
            GROUP BY nivel_prioridad
            ORDER BY 
                CASE nivel_prioridad 
                    WHEN 'CRITICA' THEN 1
                    WHEN 'ALTA' THEN 2
                    WHEN 'MEDIA' THEN 3
                    WHEN 'BAJA' THEN 4
                END
        `);

        // Estadísticas por tipo
        const typeStats = await db.query(`
            SELECT 
                tipo,
                COUNT(*) as cantidad
            FROM alertas
            WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '${dias} days'
            GROUP BY tipo
            ORDER BY cantidad DESC
        `);

        // Tendencia diaria
        const dailyTrend = await db.query(`
            SELECT 
                DATE(fecha_alerta) as fecha,
                COUNT(*) as cantidad
            FROM alertas
            WHERE fecha_alerta >= CURRENT_DATE - INTERVAL '${dias} days'
            GROUP BY DATE(fecha_alerta)
            ORDER BY fecha
        `);

        return {
            porPrioridad: priorityStats.rows,
            porTipo: typeStats.rows,
            tendenciaDiaria: dailyTrend.rows
        };
    }

    // Serializar para JSON
    toJSON() {
        return {
            id: this.id,
            estudiante_id: this.estudiante_id,
            evaluacion_id: this.evaluacion_id,
            tipo: this.tipo,
            mensaje: this.mensaje,
            nivel_prioridad: this.nivel_prioridad,
            leida: this.leida,
            fecha_alerta: this.fecha_alerta,
            fecha_leida: this.fecha_leida
        };
    }
}

module.exports = Alert;