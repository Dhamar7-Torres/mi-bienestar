const db = require('../config/database');

class Resource {
    constructor(data) {
        this.id = data.id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.tipo = data.tipo;
        this.duracion = data.duracion;
        this.url = data.url;
        this.categoria = data.categoria;
        this.activo = data.activo;
        this.fecha_creacion = data.fecha_creacion;
    }

    // Crear nuevo recurso
    static async create(resourceData) {
        const { titulo, descripcion, tipo, duracion, url, categoria } = resourceData;
        
        const result = await db.query(`
            INSERT INTO recursos (titulo, descripcion, tipo, duracion, url, categoria)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [titulo, descripcion, tipo, duracion, url, categoria]);

        return new Resource(result.rows[0]);
    }

    // Buscar por ID
    static async findById(id) {
        const result = await db.query(`
            SELECT * FROM recursos WHERE id = $1 AND activo = true
        `, [id]);

        return result.rows.length > 0 ? new Resource(result.rows[0]) : null;
    }

    // Buscar todos los recursos con filtros
    static async findAll(filters = {}, limit = 20, offset = 0) {
        let whereConditions = ['activo = true'];
        let params = [];
        let paramIndex = 1;

        if (filters.categoria) {
            whereConditions.push(`categoria = $${paramIndex}`);
            params.push(filters.categoria);
            paramIndex++;
        }

        if (filters.tipo) {
            whereConditions.push(`tipo = $${paramIndex}`);
            params.push(filters.tipo);
            paramIndex++;
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        params.push(limit, offset);

        const result = await db.query(`
            SELECT * FROM recursos
            ${whereClause}
            ORDER BY fecha_creacion DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);

        return result.rows.map(row => new Resource(row));
    }

    // Buscar por categoría
    static async findByCategory(categoria, limit = 10) {
        const result = await db.query(`
            SELECT * FROM recursos 
            WHERE categoria = $1 AND activo = true
            ORDER BY fecha_creacion DESC
            LIMIT $2
        `, [categoria, limit]);

        return result.rows.map(row => new Resource(row));
    }

    // Buscar por múltiples categorías
    static async findByCategories(categorias, limit = 20) {
        if (!Array.isArray(categorias) || categorias.length === 0) {
            return [];
        }

        const placeholders = categorias.map((_, index) => `$${index + 1}`).join(',');
        const params = [...categorias, limit];

        const result = await db.query(`
            SELECT * FROM recursos 
            WHERE categoria IN (${placeholders}) AND activo = true
            ORDER BY categoria, fecha_creacion DESC
            LIMIT $${params.length}
        `, params);

        return result.rows.map(row => new Resource(row));
    }

    // Actualizar recurso
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
            UPDATE recursos 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);

        if (result.rows.length > 0) {
            Object.assign(this, result.rows[0]);
        }

        return this;
    }

    // Desactivar recurso
    async deactivate() {
        const result = await db.query(`
            UPDATE recursos 
            SET activo = false
            WHERE id = $1
            RETURNING *
        `, [this.id]);

        if (result.rows.length > 0) {
            this.activo = false;
        }

        return this;
    }

    // Serializar para JSON
    toJSON() {
        return {
            id: this.id,
            titulo: this.titulo,
            descripcion: this.descripcion,
            tipo: this.tipo,
            duracion: this.duracion,
            url: this.url,
            categoria: this.categoria,
            activo: this.activo,
            fecha_creacion: this.fecha_creacion
        };
    }
}

module.exports = Resource;