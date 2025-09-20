// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Configurando conexión a la base de datos...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mi_bienestar_dacyti',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  // Configuraciones adicionales para debugging y rendimiento
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Manejar eventos de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
});

pool.on('connect', (client) => {
  console.log('✅ Nueva conexión establecida con la base de datos');
});

pool.on('remove', (client) => {
  console.log('🔌 Conexión removida del pool');
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Pool de base de datos inicializado correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error al inicializar el pool de base de datos:', err.message);
    return false;
  }
};

module.exports = { pool, testConnection };