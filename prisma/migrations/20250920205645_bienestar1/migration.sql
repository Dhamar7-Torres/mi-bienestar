-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "tipo_usuario" VARCHAR(20) NOT NULL,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "carrera" VARCHAR(255) NOT NULL,
    "semestre" INTEGER NOT NULL,
    "nivel_estres_actual" INTEGER DEFAULT 0,
    "nivel_burnout_actual" INTEGER DEFAULT 0,
    "estado_riesgo" VARCHAR(20) DEFAULT 'bajo',
    "fecha_ultima_evaluacion" TIMESTAMP(6),

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinadores" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "departamento" VARCHAR(255) NOT NULL,

    CONSTRAINT "coordinadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" SERIAL NOT NULL,
    "estudiante_id" INTEGER,
    "puntaje_estres" INTEGER NOT NULL,
    "puntaje_burnout" INTEGER NOT NULL,
    "puntaje_total" INTEGER NOT NULL,
    "nivel_riesgo" VARCHAR(20) NOT NULL,
    "respuestas" JSONB NOT NULL,
    "fecha_evaluacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" SERIAL NOT NULL,
    "estudiante_id" INTEGER,
    "tipo_alerta" VARCHAR(50) NOT NULL,
    "severidad" VARCHAR(20) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "esta_leida" BOOLEAN DEFAULT false,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_evaluacion" (
    "id" SERIAL NOT NULL,
    "texto_pregunta" TEXT NOT NULL,
    "categoria" VARCHAR(20) NOT NULL,
    "peso" INTEGER DEFAULT 1,
    "activa" BOOLEAN DEFAULT true,

    CONSTRAINT "preguntas_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "tipo_recurso" VARCHAR(50) NOT NULL,
    "url_contenido" VARCHAR(500),
    "categoria" VARCHAR(100),
    "activo" BOOLEAN DEFAULT true,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "idx_usuarios_correo" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "idx_usuarios_tipo" ON "usuarios"("tipo_usuario");

-- CreateIndex
CREATE INDEX "idx_estudiantes_riesgo" ON "estudiantes"("estado_riesgo");

-- CreateIndex
CREATE INDEX "idx_evaluaciones_estudiante" ON "evaluaciones"("estudiante_id");

-- CreateIndex
CREATE INDEX "idx_evaluaciones_fecha" ON "evaluaciones"("fecha_evaluacion");

-- CreateIndex
CREATE INDEX "idx_alertas_estudiante" ON "alertas"("estudiante_id");

-- CreateIndex
CREATE INDEX "idx_alertas_fecha" ON "alertas"("fecha_creacion");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coordinadores" ADD CONSTRAINT "coordinadores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
