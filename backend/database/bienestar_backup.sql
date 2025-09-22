--
-- PostgreSQL database dump
--

\restrict BniUYV6XeLgf49bAZCn1qmiqVztdP6HqYFRHArzt7ANXBuSf1d9wfUScn8mIjj2

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-21 21:37:52

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 24702)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24752)
-- Name: alertas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertas (
    id integer NOT NULL,
    estudiante_id integer,
    tipo_alerta character varying(50) NOT NULL,
    severidad character varying(20) NOT NULL,
    mensaje text NOT NULL,
    esta_leida boolean DEFAULT false,
    fecha_creacion timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    "fechaLeida" timestamp without time zone
);


ALTER TABLE public.alertas OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24751)
-- Name: alertas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alertas_id_seq OWNER TO postgres;

--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 226
-- Name: alertas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertas_id_seq OWNED BY public.alertas.id;


--
-- TOC entry 223 (class 1259 OID 24735)
-- Name: coordinadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coordinadores (
    id integer NOT NULL,
    usuario_id integer,
    departamento character varying(255) NOT NULL
);


ALTER TABLE public.coordinadores OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24734)
-- Name: coordinadores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coordinadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coordinadores_id_seq OWNER TO postgres;

--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 222
-- Name: coordinadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coordinadores_id_seq OWNED BY public.coordinadores.id;


--
-- TOC entry 221 (class 1259 OID 24725)
-- Name: estudiantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estudiantes (
    id integer NOT NULL,
    usuario_id integer,
    carrera character varying(255) NOT NULL,
    semestre integer NOT NULL,
    nivel_estres_actual integer DEFAULT 0,
    nivel_burnout_actual integer DEFAULT 0,
    estado_riesgo character varying(20) DEFAULT 'bajo'::character varying,
    fecha_ultima_evaluacion timestamp(6) without time zone
);


ALTER TABLE public.estudiantes OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24724)
-- Name: estudiantes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estudiantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estudiantes_id_seq OWNER TO postgres;

--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 220
-- Name: estudiantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estudiantes_id_seq OWNED BY public.estudiantes.id;


--
-- TOC entry 225 (class 1259 OID 24742)
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluaciones (
    id integer NOT NULL,
    estudiante_id integer,
    puntaje_estres integer NOT NULL,
    puntaje_burnout integer NOT NULL,
    puntaje_total integer NOT NULL,
    nivel_riesgo character varying(20) NOT NULL,
    respuestas jsonb NOT NULL,
    fecha_evaluacion timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.evaluaciones OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24741)
-- Name: evaluaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.evaluaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evaluaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 224
-- Name: evaluaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.evaluaciones_id_seq OWNED BY public.evaluaciones.id;


--
-- TOC entry 229 (class 1259 OID 24763)
-- Name: preguntas_evaluacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preguntas_evaluacion (
    id integer NOT NULL,
    texto_pregunta character varying(500) NOT NULL,
    categoria character varying(20) NOT NULL,
    peso integer DEFAULT 1,
    activa boolean DEFAULT true,
    orden integer
);


ALTER TABLE public.preguntas_evaluacion OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24762)
-- Name: preguntas_evaluacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preguntas_evaluacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preguntas_evaluacion_id_seq OWNER TO postgres;

--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 228
-- Name: preguntas_evaluacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preguntas_evaluacion_id_seq OWNED BY public.preguntas_evaluacion.id;


--
-- TOC entry 231 (class 1259 OID 24774)
-- Name: recursos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recursos (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    tipo_recurso character varying(50) NOT NULL,
    url_contenido character varying(500),
    categoria character varying(100),
    activo boolean DEFAULT true,
    fecha_creacion timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recursos OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24773)
-- Name: recursos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recursos_id_seq OWNER TO postgres;

--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 230
-- Name: recursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recursos_id_seq OWNED BY public.recursos.id;


--
-- TOC entry 219 (class 1259 OID 24714)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_completo character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    tipo_usuario character varying(20) NOT NULL,
    fecha_creacion timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url character varying(500)
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 24713)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 218
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 233 (class 1259 OID 25618)
-- Name: vista_alertas_completa; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_alertas_completa AS
 SELECT a.id AS alerta_id,
    a.tipo_alerta,
    a.severidad,
    a.mensaje,
    a.esta_leida,
    a.fecha_creacion,
    u.nombre_completo AS nombre_estudiante,
    e.carrera,
    (EXTRACT(epoch FROM (now() - (a.fecha_creacion)::timestamp with time zone)) / (3600)::numeric) AS horas_transcurridas
   FROM ((public.alertas a
     JOIN public.estudiantes e ON ((a.estudiante_id = e.id)))
     JOIN public.usuarios u ON ((e.usuario_id = u.id)))
  ORDER BY a.fecha_creacion DESC;


ALTER VIEW public.vista_alertas_completa OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 25613)
-- Name: vista_estudiantes_completa; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_estudiantes_completa AS
 SELECT e.id AS estudiante_id,
    u.nombre_completo,
    u.correo,
    e.carrera,
    e.semestre,
    e.nivel_estres_actual,
    e.nivel_burnout_actual,
    e.estado_riesgo,
    e.fecha_ultima_evaluacion,
    count(ev.id) AS total_evaluaciones,
    max(ev.fecha_evaluacion) AS ultima_evaluacion_fecha
   FROM ((public.estudiantes e
     JOIN public.usuarios u ON ((e.usuario_id = u.id)))
     LEFT JOIN public.evaluaciones ev ON ((e.id = ev.estudiante_id)))
  GROUP BY e.id, u.nombre_completo, u.correo, e.carrera, e.semestre, e.nivel_estres_actual, e.nivel_burnout_actual, e.estado_riesgo, e.fecha_ultima_evaluacion;


ALTER VIEW public.vista_estudiantes_completa OWNER TO postgres;

--
-- TOC entry 4789 (class 2604 OID 24755)
-- Name: alertas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas ALTER COLUMN id SET DEFAULT nextval('public.alertas_id_seq'::regclass);


--
-- TOC entry 4786 (class 2604 OID 24738)
-- Name: coordinadores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coordinadores ALTER COLUMN id SET DEFAULT nextval('public.coordinadores_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 24728)
-- Name: estudiantes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes ALTER COLUMN id SET DEFAULT nextval('public.estudiantes_id_seq'::regclass);


--
-- TOC entry 4787 (class 2604 OID 24745)
-- Name: evaluaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones ALTER COLUMN id SET DEFAULT nextval('public.evaluaciones_id_seq'::regclass);


--
-- TOC entry 4792 (class 2604 OID 24766)
-- Name: preguntas_evaluacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preguntas_evaluacion ALTER COLUMN id SET DEFAULT nextval('public.preguntas_evaluacion_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 24777)
-- Name: recursos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos ALTER COLUMN id SET DEFAULT nextval('public.recursos_id_seq'::regclass);


--
-- TOC entry 4779 (class 2604 OID 24717)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4977 (class 0 OID 24702)
-- Dependencies: 217
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5d952032-4f07-422b-af23-56da82e57828	94998ed9fb4de398abbe44a4e81ccf7260eee89c4cf622e05a17cee02515098f	2025-09-20 14:56:45.855697-06	20250920205645_bienestar1	\N	\N	2025-09-20 14:56:45.754385-06	1
\.


--
-- TOC entry 4987 (class 0 OID 24752)
-- Dependencies: 227
-- Data for Name: alertas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alertas (id, estudiante_id, tipo_alerta, severidad, mensaje, esta_leida, fecha_creacion, "fechaLeida") FROM stdin;
2	5	Estrés Alto	ALTO	Dhamar presenta niveles altos de estrés (10/10)	t	2025-09-21 03:01:42.649	2025-09-22 02:25:02.892
3	6	Estrés Alto	ALTO	Maria Torres de Dios presenta niveles altos de estrés (10/10)	t	2025-09-22 01:04:00.893	2025-09-22 02:25:02.892
4	7	Estrés Alto	ALTO	Santiago Morales presenta niveles altos de estrés (10/10)	t	2025-09-22 02:16:39.984	2025-09-22 02:25:02.892
5	10	Burnout Alto	ALTO	Niveles críticos de burnout detectados (10/10)	f	2025-09-22 03:33:47.859	\N
6	9	Estrés Alto	ALTO	Niveles críticos de estrés detectados (10/10)	f	2025-09-22 03:35:18.929	\N
\.


--
-- TOC entry 4983 (class 0 OID 24735)
-- Dependencies: 223
-- Data for Name: coordinadores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coordinadores (id, usuario_id, departamento) FROM stdin;
3	8	Coordinacion
4	9	Jefatura
\.


--
-- TOC entry 4981 (class 0 OID 24725)
-- Dependencies: 221
-- Data for Name: estudiantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estudiantes (id, usuario_id, carrera, semestre, nivel_estres_actual, nivel_burnout_actual, estado_riesgo, fecha_ultima_evaluacion) FROM stdin;
6	10	Licenciatura en Contabilidad	6	10	9	ALTO	2025-09-22 01:04:00.888
7	11	Administración	3	10	9	ALTO	2025-09-22 02:16:39.975
5	7	Ingeniería en Sistemas	1	0	10	MEDIO	2025-09-22 02:24:03.839
8	12	Artes	3	0	10	MEDIO	2025-09-22 02:54:16.36
10	14	Agricultor	11	0	10	MEDIO	2025-09-22 03:33:47.851
9	13	Biología	2	10	0	MEDIO	2025-09-22 03:35:18.923
\.


--
-- TOC entry 4985 (class 0 OID 24742)
-- Dependencies: 225
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluaciones (id, estudiante_id, puntaje_estres, puntaje_burnout, puntaje_total, nivel_riesgo, respuestas, fecha_evaluacion) FROM stdin;
5	5	10	9	10	ALTO	{"estres": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "burnout": [3, 4, 4, 4, 4, 4, 3, 3, 3, 4, 4, 4, 3, 3, 3], "tiempoRespuesta": 35}	2025-09-21 03:01:42.617
6	5	6	6	6	MEDIO	{"estres": [2, 3, 2, 1, 3, 2, 3, 2, 1, 3], "burnout": [1, 2, 3, 2, 1, 2, 4, 3, 1, 3, 3, 2, 3, 3, 1], "tiempoRespuesta": 53}	2025-09-21 23:32:05.898
7	6	2	1	2	BAJO	{"estres": [1, 0, 1, 1, 0, 1, 2, 1, 0, 1], "burnout": [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], "tiempoRespuesta": 30}	2025-09-22 01:00:36.025
8	6	10	9	10	ALTO	{"estres": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "burnout": [3, 3, 3, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 3, 4], "tiempoRespuesta": 30}	2025-09-22 01:04:00.87
9	7	1	0	1	BAJO	{"estres": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1], "burnout": [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "tiempoRespuesta": 30}	2025-09-22 02:07:09.7
10	7	10	9	10	ALTO	{"estres": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "burnout": [4, 3, 3, 4, 4, 4, 3, 3, 3, 4, 4, 4, 4, 4, 4], "tiempoRespuesta": 28}	2025-09-22 02:16:39.949
11	5	0	10	5	MEDIO	{"estres": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "burnout": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "tiempoRespuesta": 29}	2025-09-22 02:24:03.813
12	8	0	10	5	MEDIO	{"estres": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "burnout": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "tiempoRespuesta": 32}	2025-09-22 02:54:16.333
13	9	0	10	5	MEDIO	{"estres": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "burnout": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "tiempoRespuesta": 27}	2025-09-22 03:01:54.023
14	10	0	10	5	MEDIO	{"estres": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "burnout": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]}	2025-09-22 03:33:47.824
15	9	10	0	5	MEDIO	{"estres": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], "burnout": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}	2025-09-22 03:35:18.904
\.


--
-- TOC entry 4989 (class 0 OID 24763)
-- Dependencies: 229
-- Data for Name: preguntas_evaluacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preguntas_evaluacion (id, texto_pregunta, categoria, peso, activa, orden) FROM stdin;
21	¿Con qué frecuencia te has sentido nervioso o estresado por tus estudios?	ESTRES	1	t	1
22	¿Te has sentido incapaz de controlar las cosas importantes en tu vida académica?	ESTRES	1	t	2
23	¿Te has sentido seguro sobre tu capacidad para manejar tus problemas académicos?	ESTRES	1	t	3
24	¿Has sentido que las cosas van como tú quieres en tus estudios?	ESTRES	1	t	4
25	¿Has sentido que no puedes afrontar todas las cosas que tienes que hacer?	ESTRES	1	t	5
26	¿Has podido controlar las dificultades de tu vida estudiantil?	ESTRES	1	t	6
27	¿Te has sentido al mando de la situación en tus estudios?	ESTRES	1	t	7
28	¿Te has sentido irritado porque las cosas que te ocurren están fuera de tu control?	ESTRES	1	t	8
29	¿Has sentido que las dificultades académicas se acumulan tanto que no puedes superarlas?	ESTRES	1	t	9
30	¿Te has sentido confiado sobre tu capacidad para enfrentar tus responsabilidades académicas?	ESTRES	1	t	10
31	Me siento emocionalmente agotado por mis estudios	BURNOUT	1	t	1
32	Estoy "consumido" al final de un día en la universidad	BURNOUT	1	t	2
33	Estoy fatigado cuando me levanto y tengo que afrontar otro día en la universidad	BURNOUT	1	t	3
34	Estudiar o asistir a clases es realmente estresante para mí	BURNOUT	1	t	4
35	Estoy "quemado" por mis estudios	BURNOUT	1	t	5
36	Me siento frustrado por mis estudios	BURNOUT	1	t	6
37	Siento que estoy estudiando demasiado	BURNOUT	1	t	7
38	No me importa realmente lo que les ocurre a algunos de mis compañeros	BURNOUT	1	t	8
39	Trabajar con personas me produce estrés	BURNOUT	1	t	9
40	Me preocupa el hecho de que este trabajo me esté endureciendo emocionalmente	BURNOUT	1	t	10
41	He conseguido muchas cosas valiosas en mis estudios	BURNOUT	1	t	11
42	En mis estudios me siento lleno de energía	BURNOUT	1	t	12
43	Siento que estoy influyendo positivamente en las vidas de otras personas a través de mis estudios	BURNOUT	1	t	13
44	Me siento muy activo	BURNOUT	1	t	14
45	Puedo resolver de manera eficaz los problemas que surgen en mis estudios	BURNOUT	1	t	15
\.


--
-- TOC entry 4991 (class 0 OID 24774)
-- Dependencies: 231
-- Data for Name: recursos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recursos (id, titulo, descripcion, tipo_recurso, url_contenido, categoria, activo, fecha_creacion) FROM stdin;
3	Mindfulness para Estudiantes	Técnicas de atención plena adaptadas para la vida académica	video	https://youtu.be/IShkpOm63gg?si=eSVRKbBy_VmbRx-H	Bienestar Mental	t	2025-09-20 17:39:22.836419
1	Técnicas de Respiración para el Estrés	Ejercicios de respiración profunda para reducir la ansiedad	video	https://youtu.be/I5tip6L5fOQ?si=ASVRmGHBVWSkK2mh	Manejo del Estrés	t	2025-09-20 17:39:22.836419
2	Gestión Efectiva del Tiempo de Estudio	Estrategias para organizar mejor tu tiempo de estudio	video	https://youtu.be/4Dss-mavZHc?si=kSrD1nNKfDVD3g75	Productividad	t	2025-09-20 17:39:22.836419
4	Técnicas de Relajación Muscular	Ejercicios para liberar la tensión física acumulada	ejercicio	https://youtu.be/A-FKeahD_lQ?si=m8W-Z1L-sWNm4qN_	Relajación	t	2025-09-20 17:39:22.836419
6	Establecimiento de Metas Realistas	Guía para fijar objetivos académicos alcanzables	articulo	https://www.therapyside.com/post-es/como-establecer-metas-realistas	Productividad	t	2025-09-20 17:39:22.836419
5	Cómo Manejar la Ansiedad ante Exámenes	Estrategias para controlar los nervios durante evaluaciones	articulo	https://www.cun.es/chequeos-salud/vida-sana/mente-salud/diez-consejos-evitar-ansiedad-examenes	Manejo del Estrés	t	2025-09-20 17:39:22.836419
\.


--
-- TOC entry 4979 (class 0 OID 24714)
-- Dependencies: 219
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre_completo, correo, contrasena_hash, tipo_usuario, fecha_creacion, fecha_actualizacion, avatar_url) FROM stdin;
7	Dhamar Citlaly	dhamartorres4@gmail.com	$2a$12$MrGOwVvWJNgGSJNzodzAQebBseJuFgLMhRTnSNST4tZlyPUHO0FFO	ESTUDIANTE	2025-09-21 03:00:57.527	2025-09-21 15:14:28.524638	\N
9	Said Humberto Zentella Torres	saidhumberto16@gmail.com	$2a$12$qjUjw/M2571AmvfQFiqoEONZorVL2eM.Oz/fuuL/uoZ4hvzYCs1ui	COORDINADOR	2025-09-21 03:02:35.831	2025-09-21 17:53:57.031395	\N
8	Santiago Morales	santiagomoralez791@gmail.com	$2a$12$tHGhD4VCg3P2EYyTSFWLEO.OZ0J32j9RDfNWBHIwfjOYkeekvDxS.	COORDINADOR	2025-09-21 03:02:01.586	2025-09-21 17:59:14.859815	\N
10	Maria Torres de Dios	mary@gmail.com	$2a$12$1byjjsQsYm0SYFie3vloe.8jmq/mAgR/9hduHZugjyA7CKRNEO08.	ESTUDIANTE	2025-09-22 01:00:00.797	2025-09-22 01:00:00.797	\N
11	Santiago Morales	san@gmail.com	$2a$12$vLvZD98LlTHFMYzRYstWOepGkXTRxGkAjT36bZsAbPk2uKsYrOeQu	ESTUDIANTE	2025-09-22 02:06:28.277	2025-09-22 02:06:28.277	\N
12	Karla Fernanda Zapata Torres	karla@gmail.com	$2a$12$ren6VKx81aM/1Ui08HJgrOueDwjX3mw4g1.J.gFhenpb.o3UbOApS	ESTUDIANTE	2025-09-22 02:53:39.475	2025-09-22 02:53:39.475	\N
13	Miguel Zentella	miguel@hotmail.com	$2a$12$RcWW9NHT0IVjuj1DUN.P8O9CPg8jxCfvqa2IEzbPRq30rFGL3ewT6	ESTUDIANTE	2025-09-22 03:00:28.305	2025-09-22 03:00:28.305	\N
14	Isidro Torres	chilo@hotmail.com	$2a$12$lLL1gX7ASZxmQZtv80W0Duu7qEq9d1iAKsMr8QYZkn9lMMI6QQrSy	ESTUDIANTE	2025-09-22 03:24:10.66	2025-09-22 03:24:10.66	\N
\.


--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 226
-- Name: alertas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alertas_id_seq', 6, true);


--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 222
-- Name: coordinadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coordinadores_id_seq', 4, true);


--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 220
-- Name: estudiantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estudiantes_id_seq', 10, true);


--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 224
-- Name: evaluaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evaluaciones_id_seq', 15, true);


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 228
-- Name: preguntas_evaluacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preguntas_evaluacion_id_seq', 45, true);


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 230
-- Name: recursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recursos_id_seq', 6, true);


--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 218
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 14, true);


--
-- TOC entry 4799 (class 2606 OID 24710)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 24761)
-- Name: alertas alertas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 24740)
-- Name: coordinadores coordinadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coordinadores
    ADD CONSTRAINT coordinadores_pkey PRIMARY KEY (id);


--
-- TOC entry 4807 (class 2606 OID 24733)
-- Name: estudiantes estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_pkey PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 24750)
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4821 (class 2606 OID 24772)
-- Name: preguntas_evaluacion preguntas_evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preguntas_evaluacion
    ADD CONSTRAINT preguntas_evaluacion_pkey PRIMARY KEY (id);


--
-- TOC entry 4823 (class 2606 OID 24783)
-- Name: recursos recursos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos
    ADD CONSTRAINT recursos_pkey PRIMARY KEY (id);


--
-- TOC entry 4805 (class 2606 OID 24723)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4817 (class 1259 OID 32768)
-- Name: idx_alerta_esta_leida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerta_esta_leida ON public.alertas USING btree (esta_leida);


--
-- TOC entry 4818 (class 1259 OID 24790)
-- Name: idx_alertas_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_estudiante ON public.alertas USING btree (estudiante_id);


--
-- TOC entry 4819 (class 1259 OID 24791)
-- Name: idx_alertas_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_fecha ON public.alertas USING btree (fecha_creacion);


--
-- TOC entry 4808 (class 1259 OID 24787)
-- Name: idx_estudiantes_riesgo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiantes_riesgo ON public.estudiantes USING btree (estado_riesgo);


--
-- TOC entry 4813 (class 1259 OID 24788)
-- Name: idx_evaluaciones_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_estudiante ON public.evaluaciones USING btree (estudiante_id);


--
-- TOC entry 4814 (class 1259 OID 24789)
-- Name: idx_evaluaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_fecha ON public.evaluaciones USING btree (fecha_evaluacion);


--
-- TOC entry 4800 (class 1259 OID 25634)
-- Name: idx_usuarios_avatar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_avatar ON public.usuarios USING btree (avatar_url) WHERE (avatar_url IS NOT NULL);


--
-- TOC entry 4801 (class 1259 OID 24785)
-- Name: idx_usuarios_correo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_correo ON public.usuarios USING btree (correo);


--
-- TOC entry 4802 (class 1259 OID 24786)
-- Name: idx_usuarios_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_tipo ON public.usuarios USING btree (tipo_usuario);


--
-- TOC entry 4803 (class 1259 OID 24784)
-- Name: usuarios_correo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_correo_key ON public.usuarios USING btree (correo);


--
-- TOC entry 4828 (class 2620 OID 25625)
-- Name: usuarios actualizar_usuarios_fecha; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER actualizar_usuarios_fecha BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_actualizacion();


--
-- TOC entry 4829 (class 2620 OID 25627)
-- Name: evaluaciones trigger_generar_alerta; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generar_alerta AFTER INSERT ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION public.generar_alerta_automatica();


--
-- TOC entry 4827 (class 2606 OID 24807)
-- Name: alertas alertas_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


--
-- TOC entry 4825 (class 2606 OID 24797)
-- Name: coordinadores coordinadores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coordinadores
    ADD CONSTRAINT coordinadores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4824 (class 2606 OID 24792)
-- Name: estudiantes estudiantes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4826 (class 2606 OID 24802)
-- Name: evaluaciones evaluaciones_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


-- Completed on 2025-09-21 21:37:52

--
-- PostgreSQL database dump complete
--

\unrestrict BniUYV6XeLgf49bAZCn1qmiqVztdP6HqYFRHArzt7ANXBuSf1d9wfUScn8mIjj2

