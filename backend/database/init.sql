-- Crear base de datos
CREATE DATABASE mi_bienestar_dacyti;

-- Tabla estudiantes
CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    carrera VARCHAR(255) NOT NULL,
    contrasena VARCHAR(255),
    semestre INTEGER NOT NULL CHECK (semestre > 0),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    departamento VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla cuestionarios
CREATE TABLE cuestionarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla preguntas
CREATE TABLE preguntas (
    id SERIAL PRIMARY KEY,
    cuestionario_id INTEGER REFERENCES cuestionarios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- 'estres', 'agotamiento', 'sobrecarga', 'burnout'
    orden INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    tipo_respuesta VARCHAR(50) DEFAULT 'escala_1_10',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla evaluaciones
CREATE TABLE evaluaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    cuestionario_id INTEGER REFERENCES cuestionarios(id) ON DELETE CASCADE,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completada BOOLEAN DEFAULT FALSE,
    tiempo_completado INTEGER, -- minutos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla respuestas
CREATE TABLE respuestas (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER REFERENCES evaluaciones(id) ON DELETE CASCADE,
    pregunta_id INTEGER REFERENCES preguntas(id) ON DELETE CASCADE,
    valor INTEGER NOT NULL CHECK (valor >= 1 AND valor <= 10),
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla puntajes_calculados
CREATE TABLE puntajes_calculados (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER REFERENCES evaluaciones(id) ON DELETE CASCADE,
    estres DECIMAL(4,2) NOT NULL,
    agotamiento DECIMAL(4,2) NOT NULL,
    sobrecarga DECIMAL(4,2) NOT NULL,
    burnout DECIMAL(4,2) NOT NULL,
    promedio_general DECIMAL(4,2) NOT NULL,
    nivel_riesgo VARCHAR(20) NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'MEDIO', 'ALTO')),
    fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla alertas
CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    evaluacion_id INTEGER REFERENCES evaluaciones(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    nivel_prioridad VARCHAR(20) NOT NULL CHECK (nivel_prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    leida BOOLEAN DEFAULT FALSE,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_leida TIMESTAMP NULL
);

-- Tabla recursos
CREATE TABLE recursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('video', 'articulo', 'audio', 'documento', 'herramienta')),
    duracion INTEGER, -- minutos
    urls TEXT,
    categoria VARCHAR(100) NOT NULL, -- 'estres', 'agotamiento', 'sobrecarga', 'burnout', 'general'
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_estudiantes_email ON estudiantes(email);
CREATE INDEX idx_evaluaciones_estudiante ON evaluaciones(estudiante_id);
CREATE INDEX idx_evaluaciones_fecha ON evaluaciones(fecha_evaluacion);
CREATE INDEX idx_respuestas_evaluacion ON respuestas(evaluacion_id);
CREATE INDEX idx_alertas_estudiante ON alertas(estudiante_id);
CREATE INDEX idx_alertas_fecha ON alertas(fecha_alerta);
CREATE INDEX idx_puntajes_evaluacion ON puntajes_calculados(evaluacion_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_estudiantes_email ON estudiantes(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_estudiantes_activo ON estudiantes(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Comentarios para documentar las tablas
COMMENT ON TABLE estudiantes IS 'Tabla de estudiantes del sistema';
COMMENT ON COLUMN estudiantes.contrasena IS 'Contraseña hasheada del estudiante';

COMMENT ON TABLE usuarios IS 'Tabla de usuarios administradores del sistema';
COMMENT ON COLUMN usuarios.role IS 'Rol del usuario: admin, coordinator, etc.';
COMMENT ON COLUMN usuarios.departamento IS 'Departamento al que pertenece el usuario';