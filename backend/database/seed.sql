-- Insertar cuestionario principal
INSERT INTO cuestionarios (nombre, descripcion) VALUES 
('Evaluación Semanal de Bienestar Psicosocial', 'Cuestionario integral basado en escalas validadas para detectar factores de riesgo psicosocial en estudiantes de alto rendimiento');

-- Insertar preguntas basadas en escalas validadas

-- PREGUNTAS DE ESTRÉS (basadas en Escala de Estrés Percibido - PSS)
INSERT INTO preguntas (cuestionario_id, texto, categoria, orden) VALUES
(1, '¿Con qué frecuencia te has sentido nervioso(a) o estresado(a) en la última semana?', 'estres', 1),
(1, '¿Con qué frecuencia has sentido que no podías controlar las cosas importantes en tu vida académica?', 'estres', 2),
(1, '¿Con qué frecuencia te has sentido seguro(a) de tu capacidad para manejar tus problemas académicos?', 'estres', 3),
(1, '¿Con qué frecuencia has sentido que las cosas van bien en tus estudios?', 'estres', 4),
(1, '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas que tenías que hacer?', 'estres', 5),
(1, '¿Con qué frecuencia has podido controlar las dificultades en tu vida académica?', 'estres', 6),
(1, '¿Con qué frecuencia te has sentido al límite de tu capacidad de manejo del estrés?', 'estres', 7),
(1, '¿Con qué frecuencia has sentido que tienes todo bajo control en tus estudios?', 'estres', 8),
(1, '¿Con qué frecuencia te has enfadado porque las cosas que te han ocurrido estaban fuera de tu control?', 'estres', 9),
(1, '¿Con qué frecuencia has sentido que las dificultades académicas se acumulan tanto que no puedes superarlas?', 'estres', 10);

-- PREGUNTAS DE AGOTAMIENTO (basadas en Inventario de Burnout de Maslach adaptado)
INSERT INTO preguntas (cuestionario_id, texto, categoria, orden) VALUES
(1, '¿Te sientes emocionalmente agotado(a) por tus estudios?', 'agotamiento', 11),
(1, '¿Te sientes fatigado(a) cuando te levantas por la mañana y tienes que enfrentarte a otro día de estudios?', 'agotamiento', 12),
(1, '¿Trabajar con libros y tareas todo el día es realmente estresante para ti?', 'agotamiento', 13),
(1, '¿Te sientes quemado(a) por tus estudios?', 'agotamiento', 14),
(1, '¿Te sientes frustrado(a) en tus estudios?', 'agotamiento', 15),
(1, '¿Sientes que estás trabajando demasiado duro en tus estudios?', 'agotamiento', 16),
(1, '¿Te sientes al límite de tus fuerzas después de un día de estudio intenso?', 'agotamiento', 17),
(1, '¿Has perdido interés en tus estudios desde que comenzaste la carrera?', 'agotamiento', 18),
(1, '¿Te sientes menos entusiasmado(a) acerca de tus estudios?', 'agotamiento', 19),
(1, '¿Te resulta difícil relajarte después de un día de estudios?', 'agotamiento', 20);

-- PREGUNTAS DE SOBRECARGA ACADÉMICA
INSERT INTO preguntas (cuestionario_id, texto, categoria, orden) VALUES
(1, '¿Sientes que tienes demasiadas tareas y responsabilidades académicas?', 'sobrecarga', 21),
(1, '¿Te resulta difícil equilibrar todas las demandas de tus diferentes materias?', 'sobrecarga', 22),
(1, '¿Sientes que no tienes suficiente tiempo para completar todas tus tareas académicas?', 'sobrecarga', 23),
(1, '¿Te sientes abrumado(a) por la cantidad de información que debes procesar?', 'sobrecarga', 24),
(1, '¿Sientes presión constante por mantener un alto rendimiento académico?', 'sobrecarga', 25),
(1, '¿Te resulta difícil encontrar tiempo para actividades no académicas?', 'sobrecarga', 26),
(1, '¿Sientes que las expectativas académicas son demasiado altas?', 'sobrecarga', 27),
(1, '¿Te sientes presionado(a) por cumplir con múltiples fechas límite simultáneamente?', 'sobrecarga', 28),
(1, '¿Sientes que sacrificas tu vida social por mantener tu rendimiento académico?', 'sobrecarga', 29),
(1, '¿Te resulta difícil decir "no" a compromisos académicos adicionales?', 'sobrecarga', 30);

-- PREGUNTAS DE BURNOUT ACADÉMICO
INSERT INTO preguntas (cuestionario_id, texto, categoria, orden) VALUES
(1, '¿Has perdido el interés y la motivación por tus estudios?', 'burnout', 31),
(1, '¿Sientes que tus estudios han perdido significado para ti?', 'burnout', 32),
(1, '¿Te resulta difícil concentrarte en tus tareas académicas?', 'burnout', 33),
(1, '¿Sientes que has desarrollado una actitud cínica hacia tus estudios?', 'burnout', 34),
(1, '¿Dudas del valor y la utilidad de tus estudios?', 'burnout', 35),
(1, '¿Te sientes desconectado(a) de tu propósito académico?', 'burnout', 36),
(1, '¿Sientes que solo estás "yendo por las mociones" en tus estudios?', 'burnout', 37),
(1, '¿Has pensado seriamente en abandonar tus estudios?', 'burnout', 38),
(1, '¿Sientes que ya no te importan tanto tus calificaciones como antes?', 'burnout', 39),
(1, '¿Te resulta difícil encontrar satisfacción en tus logros académicos?', 'burnout', 40);

-- Insertar estudiantes de ejemplo
INSERT INTO estudiantes (nombre, email, carrera, semestre) VALUES
('Ana García López', 'ana.garcia@universidad.edu', 'Ingeniería de Sistemas', 6),
('Carlos Mendoza', 'carlos.mendoza@universidad.edu', 'Psicología', 4),
('María Rodríguez', 'maria.rodriguez@universidad.edu', 'Medicina', 8),
('Diego Fernández', 'diego.fernandez@universidad.edu', 'Arquitectura', 5),
('Laura Martínez', 'laura.martinez@universidad.edu', 'Derecho', 7),
('Andrés Ruiz', 'andres.ruiz@universidad.edu', 'Ingeniería Civil', 3),
('Sofía Castro', 'sofia.castro@universidad.edu', 'Administración', 6),
('Miguel Torres', 'miguel.torres@universidad.edu', 'Comunicación Social', 2),
('Isabella Morales', 'isabella.morales@universidad.edu', 'Biología', 5),
('Sebastián Herrera', 'sebastian.herrera@universidad.edu', 'Economía', 4);

-- Insertar recursos de apoyo
INSERT INTO recursos (titulo, descripcion, tipo, duracion, url, categoria) VALUES
-- Recursos para Estrés
('Técnicas de Respiración para Reducir el Estrés', 'Video guía con ejercicios de respiración profunda y relajación', 'video', 15, 'https://placeholder-image-service.onrender.com/video/breathing-techniques', 'estres'),
('Mindfulness para Estudiantes', 'Meditación guiada específicamente diseñada para estudiantes universitarios', 'audio', 20, 'https://placeholder-image-service.onrender.com/audio/mindfulness-students', 'estres'),
('Manejo del Estrés Académico', 'Artículo con estrategias científicamente respaldadas', 'articulo', 10, 'https://placeholder-image-service.onrender.com/article/stress-management', 'estres'),
('App de Meditación Calm', 'Aplicación móvil para meditación y relajación', 'herramienta', NULL, 'https://calm.com', 'estres'),

-- Recursos para Agotamiento
('Recuperación del Agotamiento Mental', 'Técnicas para restaurar la energía mental y física', 'video', 25, 'https://placeholder-image-service.onrender.com/video/mental-recovery', 'agotamiento'),
('Rutinas de Sueño Reparador', 'Guía para mejorar la calidad del sueño', 'articulo', 12, 'https://placeholder-image-service.onrender.com/article/sleep-hygiene', 'agotamiento'),
('Yoga para Estudiantes', 'Secuencia de yoga para aliviar tensión física y mental', 'video', 30, 'https://placeholder-image-service.onrender.com/video/student-yoga', 'agotamiento'),
('Suplementos Naturales para la Energía', 'Información sobre suplementos seguros para combatir el agotamiento', 'documento', 8, 'https://placeholder-image-service.onrender.com/doc/natural-supplements', 'agotamiento'),

-- Recursos para Sobrecarga
('Gestión del Tiempo para Estudiantes', 'Técnicas avanzadas de organización y productividad', 'video', 35, 'https://placeholder-image-service.onrender.com/video/time-management', 'sobrecarga'),
('Método Pomodoro Explicado', 'Técnica de productividad para manejar múltiples tareas', 'articulo', 6, 'https://placeholder-image-service.onrender.com/article/pomodoro-technique', 'sobrecarga'),
('Planificador Académico Digital', 'Herramienta para organizar tareas y fechas límite', 'herramienta', NULL, 'https://todoist.com', 'sobrecarga'),
('Matriz de Eisenhower', 'Método para priorizar tareas según urgencia e importancia', 'documento', 5, 'https://placeholder-image-service.onrender.com/doc/eisenhower-matrix', 'sobrecarga'),

-- Recursos para Burnout
('Redescubriendo la Motivación Académica', 'Estrategias para reconectar con el propósito de estudiar', 'video', 40, 'https://placeholder-image-service.onrender.com/video/academic-motivation', 'burnout'),
('Prevención del Burnout Estudiantil', 'Artículo científico sobre prevención y tratamiento', 'articulo', 15, 'https://placeholder-image-service.onrender.com/article/burnout-prevention', 'burnout'),
('Terapia Cognitivo-Conductual', 'Ejercicios de TCC para cambiar patrones de pensamiento negativos', 'documento', 20, 'https://placeholder-image-service.onrender.com/doc/cbt-exercises', 'burnout'),
('Contactos de Apoyo Psicológico', 'Directorio de servicios de salud mental universitarios', 'herramienta', NULL, 'https://universidad.edu/bienestar', 'burnout'),

-- Recursos Generales
('Balance Vida-Estudio', 'Guía integral para mantener equilibrio personal y académico', 'video', 45, 'https://placeholder-image-service.onrender.com/video/life-balance', 'general'),
('Alimentación para el Cerebro', 'Nutrición óptima para el rendimiento académico', 'articulo', 8, 'https://placeholder-image-service.onrender.com/article/brain-nutrition', 'general'),
('Red de Apoyo Estudiantil', 'Plataforma para conectar con otros estudiantes', 'herramienta', NULL, 'https://universidad.edu/red-apoyo', 'general');