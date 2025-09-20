const db = require('../config/database');

class Student {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.email = data.email;
        this.carrera = data.carrera;
        this.semestre = data.semestre;
        this.fecha_registro = data.fecha_registro;
        this.activo = data.activo;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear nuevo estudiante
    static async create(studentData) {
        const { nombre, email, carrera, semestre } = studentData;
        
        const result = await db.query(`
            INSERT INTO estudiantes (nombre, email, carrera, semestre)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [nombre, email, carrera, semestre]);

        return new Student(result.rows[0]);
    }

    // Buscar por ID
    static async findById(id) {
        const result = await db.query(`
            SELECT * FROM estudiantes WHERE id = $1 AND activo = true
        `, [id]);

        return result.rows.length > 0 ? new Student(result.rows[0]) : null;
    }

    // Buscar por email
    static async findByEmail(email) {
        const result = await db.query(`
            SELECT * FROM estudiantes WHERE email = $1 AND activo = true
        `, [email]);

        return result.rows.length > 0 ? new Student(result.rows[0]) : null;
    }

    // Buscar todos los estudiantes activos
    static async findAll(limit = 50, offset = 0) {
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
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        return result.rows.map(row => ({
            ...new Student(row),
            total_evaluaciones: parseInt(row.total_evaluaciones) || 0,
            ultimo_promedio: row.ultimo_promedio ? parseFloat(row.ultimo_promedio) : null,
            nivel_riesgo_actual: row.nivel_riesgo_actual,
            alertas_pendientes: parseInt(row.alertas_pendientes) || 0
        }));
    }

    // Actualizar estudiante
    async update(updateData) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(this.id);
        
        const result = await db.query(`
            UPDATE estudiantes 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);

        if (result.rows.length > 0) {
            Object.assign(this, result.rows[0]);
        }

        return this;
    }

    // Desactivar estudiante (soft delete)
    async deactivate() {
        const result = await db.query(`
            UPDATE estudiantes 
            SET activo = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [this.id]);

        if (result.rows.length > 0) {
            this.activo = false;
            this.updated_at = result.rows[0].updated_at;
        }

        return this;
    }

    // Obtener evaluaciones del estudiante
    async getEvaluations(limit = 10) {
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
            LIMIT $2
        `, [this.id, limit]);

        return result.rows;
    }

    // Obtener alertas del estudiante
    async getAlerts(includeRead = false, limit = 10) {
        let whereClause = 'WHERE estudiante_id = $1';
        const params = [this.id];

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

        return result.rows;
    }

    // Serializar para JSON
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            email: this.email,
            carrera: this.carrera,
            semestre: this.semestre,
            fecha_registro: this.fecha_registro,
            activo: this.activo,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Student;