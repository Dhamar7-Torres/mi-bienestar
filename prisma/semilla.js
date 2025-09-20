const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function principal() {
  console.log('🌱 Iniciando semilla completa de datos...');
  
  try {
    console.log('📝 Agregando preguntas de evaluación...');
    
    // PREGUNTAS DE ESTRÉS
    const preguntasEstres = [
      '¿Con qué frecuencia te sientes abrumado/a por la carga de trabajo académico?',
      '¿Qué tan difícil te resulta concentrarte en tus estudios?',
      '¿Con qué frecuencia experimentas ansiedad antes de exámenes o entregas?',
      '¿Te sientes nervioso/a o inquieto/a sin razón aparente?',
      '¿Tienes dificultades para dormir debido a preocupaciones académicas?',
      '¿Sientes tensión muscular o dolores de cabeza frecuentes?',
      '¿Te resulta difícil relajarte incluso en tu tiempo libre?',
      '¿Sientes que no tienes suficiente tiempo para completar tus tareas?',
      '¿Te preocupas constantemente por tu rendimiento académico?',
      '¿Experimentas cambios en tu apetito relacionados con el estrés?'
    ];
    
    let orden = 1;
    for (const pregunta of preguntasEstres) {
      await prisma.preguntaEvaluacion.create({
        data: {
          textoPregunta: pregunta,
          categoria: 'ESTRES',
          peso: [1, 3, 5, 7, 9].includes(orden) ? 2 : 1, // Algunas preguntas tienen más peso
          activa: true,
          orden: orden
        }
      });
      orden++;
    }
    
    // PREGUNTAS DE BURNOUT
    const preguntasBurnout = [
      '¿Te sientes emocionalmente agotado/a por tus estudios?',
      '¿Has perdido interés o motivación en tus materias?',
      '¿Sientes que tus estudios no tienen sentido o propósito?',
      '¿Te resulta difícil levantarte por las mañanas para ir a clases?',
      '¿Sientes que ya no disfrutas actividades que antes te gustaban?',
      '¿Te sientes desconectado/a de tus compañeros de clase?',
      '¿Tienes pensamientos negativos sobre tu futuro profesional?',
      '¿Sientes que no importa cuánto te esfuerces, no es suficiente?',
      '¿Experimentas sentimientos de desesperanza sobre tus estudios?',
      '¿Te sientes mentalmente exhausto/a al final del día?'
    ];
    
    for (const pregunta of preguntasBurnout) {
      await prisma.preguntaEvaluacion.create({
        data: {
          textoPregunta: pregunta,
          categoria: 'BURNOUT',
          peso: [1, 2, 3, 7, 8, 9, 10].includes(orden - 10) ? 2 : 1,
          activa: true,
          orden: orden
        }
      });
      orden++;
    }
    
    console.log(`❓ ${preguntasEstres.length + preguntasBurnout.length} preguntas creadas`);
    
    console.log('📚 Agregando recursos educativos...');
    
    // RECURSOS EDUCATIVOS
    const recursos = [
      {
        titulo: 'Técnicas de Respiración para el Estrés',
        descripcion: 'Ejercicios de respiración profunda para reducir la ansiedad y el estrés académico',
        tipoRecurso: 'VIDEO',
        urlContenido: 'https://www.youtube.com/watch?v=ejemplo1',
        categoria: 'Manejo del Estrés'
      },
      {
        titulo: 'Gestión Efectiva del Tiempo de Estudio',
        descripcion: 'Estrategias comprobadas para organizar mejor tu tiempo de estudio y aumentar la productividad',
        tipoRecurso: 'VIDEO',
        urlContenido: 'https://www.youtube.com/watch?v=ejemplo2',
        categoria: 'Productividad'
      },
      {
        titulo: 'Mindfulness para Estudiantes',
        descripcion: 'Técnicas de atención plena adaptadas específicamente para la vida académica',
        tipoRecurso: 'VIDEO',
        urlContenido: 'https://www.youtube.com/watch?v=ejemplo3',
        categoria: 'Bienestar Mental'
      },
      {
        titulo: 'Técnicas de Relajación Muscular Progresiva',
        descripcion: 'Ejercicios paso a paso para liberar la tensión física acumulada por el estrés',
        tipoRecurso: 'EJERCICIO',
        urlContenido: 'https://www.ejemplo.com/relajacion',
        categoria: 'Relajación'
      },
      {
        titulo: 'Cómo Manejar la Ansiedad ante Exámenes',
        descripcion: 'Estrategias psicológicas para controlar los nervios y el miedo durante las evaluaciones',
        tipoRecurso: 'ARTICULO',
        urlContenido: 'https://www.ejemplo.com/ansiedad-examenes',
        categoria: 'Manejo del Estrés'
      },
      {
        titulo: 'Establecimiento de Metas Académicas Realistas',
        descripcion: 'Guía completa para fijar objetivos académicos alcanzables y mantener la motivación',
        tipoRecurso: 'ARTICULO',
        urlContenido: 'https://www.ejemplo.com/metas-academicas',
        categoria: 'Productividad'
      },
      {
        titulo: 'Ejercicios de Meditación para Estudiantes',
        descripcion: 'Rutinas de meditación de 5 y 10 minutos diseñadas para estudiantes',
        tipoRecurso: 'TECNICA',
        urlContenido: 'https://www.ejemplo.com/meditacion',
        categoria: 'Bienestar Mental'
      },
      {
        titulo: 'Técnica Pomodoro para Estudiar',
        descripcion: 'Método de gestión del tiempo que alterna períodos de trabajo con descansos',
        tipoRecurso: 'TECNICA',
        urlContenido: 'https://www.ejemplo.com/pomodoro',
        categoria: 'Productividad'
      }
    ];
    
    for (const recurso of recursos) {
      await prisma.recurso.create({ data: recurso });
    }
    
    console.log(`📚 ${recursos.length} recursos educativos creados`);
    
    console.log('📊 Agregando evaluaciones de ejemplo...');
    
    // EVALUACIONES DE EJEMPLO
    // Obtener estudiantes existentes
    const estudiantes = await prisma.estudiante.findMany();
    
    if (estudiantes.length > 0) {
      // Evaluación para Ana García (riesgo alto)
      await prisma.evaluacion.create({
        data: {
          estudianteId: estudiantes[0].id,
          puntajeEstres: 8,
          puntajeBurnout: 7,
          puntajeTotal: 15,
          nivelRiesgo: 'ALTO',
          respuestas: {
            estres: [4, 4, 3, 3, 4, 3, 4, 4, 4, 2],
            burnout: [4, 3, 4, 2, 3, 2, 4, 4, 3, 4],
            tiempoRespuesta: 420,
            metadata: {
              fechaEvaluacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              version: '1.0'
            }
          },
          fechaEvaluacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      });

      // Evaluación anterior para Ana García (para mostrar tendencia)
      await prisma.evaluacion.create({
        data: {
          estudianteId: estudiantes[0].id,
          puntajeEstres: 6,
          puntajeBurnout: 5,
          puntajeTotal: 11,
          nivelRiesgo: 'MEDIO',
          respuestas: {
            estres: [3, 3, 2, 2, 3, 2, 3, 3, 3, 1],
            burnout: [3, 2, 3, 1, 2, 1, 3, 3, 2, 3],
            tiempoRespuesta: 380
          },
          fechaEvaluacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Si hay más estudiantes, agregar más evaluaciones
      if (estudiantes.length > 1) {
        await prisma.evaluacion.create({
          data: {
            estudianteId: estudiantes[1].id,
            puntajeEstres: 5,
            puntajeBurnout: 4,
            puntajeTotal: 9,
            nivelRiesgo: 'MEDIO',
            respuestas: {
              estres: [2, 3, 2, 2, 2, 1, 3, 2, 3, 1],
              burnout: [2, 2, 2, 1, 2, 1, 2, 2, 2, 2],
              tiempoRespuesta: 310
            },
            fechaEvaluacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        });
      }

      if (estudiantes.length > 2) {
        await prisma.evaluacion.create({
          data: {
            estudianteId: estudiantes[2].id,
            puntajeEstres: 3,
            puntajeBurnout: 2,
            puntajeTotal: 5,
            nivelRiesgo: 'BAJO',
            respuestas: {
              estres: [1, 2, 1, 1, 1, 0, 2, 1, 2, 0],
              burnout: [1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
              tiempoRespuesta: 290
            },
            fechaEvaluacion: new Date(Date.now() - 3 * 60 * 60 * 1000)
          }
        });
      }
    }
    
    console.log('📊 Evaluaciones de ejemplo creadas');
    
    console.log('🚨 Agregando alertas...');
    
    // ALERTAS DE EJEMPLO
    if (estudiantes.length > 0) {
      // Obtener nombres de usuarios para alertas
      const usuariosEstudiantes = await prisma.usuario.findMany({
        where: {
          id: { in: estudiantes.map(e => e.usuarioId) }
        }
      });

      // Alerta para estudiante de riesgo alto
      await prisma.alerta.create({
        data: {
          estudianteId: estudiantes[0].id,
          tipoAlerta: 'Burnout Alto',
          severidad: 'ALTO',
          mensaje: `${usuariosEstudiantes[0].nombreCompleto} presenta niveles altos de burnout (7/10)`,
          estaLeida: false,
          fechaCreacion: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
        }
      });

      await prisma.alerta.create({
        data: {
          estudianteId: estudiantes[0].id,
          tipoAlerta: 'Estrés Alto',
          severidad: 'ALTO',
          mensaje: `${usuariosEstudiantes[0].nombreCompleto} presenta niveles altos de estrés (8/10)`,
          estaLeida: false,
          fechaCreacion: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
        }
      });

      // Alerta para estudiante de riesgo medio (si existe)
      if (estudiantes.length > 1) {
        await prisma.alerta.create({
          data: {
            estudianteId: estudiantes[1].id,
            tipoAlerta: 'Riesgo Moderado',
            severidad: 'MEDIO',
            mensaje: `${usuariosEstudiantes[1].nombreCompleto} muestra signos de estrés moderado`,
            estaLeida: false,
            fechaCreacion: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
          }
        });
      }
    }
    
    console.log('🚨 Alertas creadas');
    
    // Actualizar fechas de última evaluación en estudiantes
    console.log('🔄 Actualizando fechas de última evaluación...');
    
    if (estudiantes.length > 0) {
      await prisma.estudiante.update({
        where: { id: estudiantes[0].id },
        data: { fechaUltimaEvaluacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      });

      if (estudiantes.length > 1) {
        await prisma.estudiante.update({
          where: { id: estudiantes[1].id },
          data: { fechaUltimaEvaluacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        });
      }

      if (estudiantes.length > 2) {
        await prisma.estudiante.update({
          where: { id: estudiantes[2].id },
          data: { fechaUltimaEvaluacion: new Date(Date.now() - 3 * 60 * 60 * 1000) }
        });
      }
    }
    
    console.log('✅ Semilla completa terminada exitosamente');
    
    // Mostrar resumen final
    const conteoUsuarios = await prisma.usuario.count();
    const conteoEstudiantes = await prisma.estudiante.count();
    const conteoCoordinadores = await prisma.coordinador.count();
    const conteoPreguntas = await prisma.preguntaEvaluacion.count();
    const conteoRecursos = await prisma.recurso.count();
    const conteoEvaluaciones = await prisma.evaluacion.count();
    const conteoAlertas = await prisma.alerta.count();
    
    console.log('\n📈 RESUMEN FINAL DE DATOS:');
    console.log(`   👥 Usuarios: ${conteoUsuarios}`);
    console.log(`   🎓 Estudiantes: ${conteoEstudiantes}`);
    console.log(`   👨‍💼 Coordinadores: ${conteoCoordinadores}`);
    console.log(`   ❓ Preguntas: ${conteoPreguntas}`);
    console.log(`   📚 Recursos: ${conteoRecursos}`);
    console.log(`   📊 Evaluaciones: ${conteoEvaluaciones}`);
    console.log(`   🚨 Alertas: ${conteoAlertas}`);
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('   📧 Estudiantes:');
    console.log('      - ana.garcia@universidad.edu / estudiante123');
    console.log('      - carlos.mendoza@universidad.edu / estudiante123');
    console.log('      - maria.silva@universidad.edu / estudiante123');
    console.log('   👨‍💼 Coordinadores:');
    console.log('      - roberto.martinez@universidad.edu / coordinador123');
    console.log('      - laura.jimenez@universidad.edu / coordinador123');
    
  } catch (error) {
    console.error('❌ Error ejecutando semilla:', error);
    console.error('Detalles del error:', error.message);
    throw error;
  }
}

principal()
  .catch((e) => {
    console.error('Error general:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });