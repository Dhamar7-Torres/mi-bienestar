const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function principal() {
  console.log('🌱 Iniciando semilla de datos...');
  
  try {
    // Crear contraseñas hasheadas
    const contrasenaEstudiante = await bcrypt.hash('estudiante123', 10);
    const contrasenaCoordinador = await bcrypt.hash('coordinador123', 10);
    
    // Crear usuarios
    const usuario1 = await prisma.usuario.create({
      data: {
        nombreCompleto: 'Ana García López',
        correo: 'ana.garcia@universidad.edu',
        contrasenaHash: contrasenaEstudiante,
        tipoUsuario: 'ESTUDIANTE'
      }
    });

    const usuario2 = await prisma.usuario.create({
      data: {
        nombreCompleto: 'Dr. Roberto Martínez',
        correo: 'roberto.martinez@universidad.edu',
        contrasenaHash: contrasenaCoordinador,
        tipoUsuario: 'COORDINADOR'
      }
    });
    
    console.log('👥 Usuarios creados');
    
    // Crear estudiante
    await prisma.estudiante.create({
      data: {
        usuarioId: usuario1.id,
        carrera: 'Ingeniería de Sistemas',
        semestre: 8,
        nivelEstresActual: 7,
        nivelBurnoutActual: 6,
        estadoRiesgo: 'ALTO'
      }
    });
    
    // Crear coordinador
    await prisma.coordinador.create({
      data: {
        usuarioId: usuario2.id,
        departamento: 'Departamento de Bienestar Estudiantil'
      }
    });
    
    console.log('🎓 Perfiles creados');
    
    // Crear algunas preguntas básicas
    await prisma.preguntaEvaluacion.create({
      data: {
        textoPregunta: '¿Con qué frecuencia te sientes abrumado/a por la carga de trabajo académico?',
        categoria: 'ESTRES',
        peso: 2,
        activa: true,
        orden: 1
      }
    });

    await prisma.preguntaEvaluacion.create({
      data: {
        textoPregunta: '¿Te sientes emocionalmente agotado/a por tus estudios?',
        categoria: 'BURNOUT',
        peso: 2,
        activa: true,
        orden: 2
      }
    });
    
    console.log('❓ Preguntas creadas');
    
    console.log('✅ Semilla completada exitosamente');
    console.log('\n🔑 CREDENCIALES DE PRUEBA:');
    console.log('   📧 Estudiante: ana.garcia@universidad.edu / estudiante123');
    console.log('   👨‍💼 Coordinador: roberto.martinez@universidad.edu / coordinador123');
    
  } catch (error) {
    console.error('❌ Error ejecutando semilla:', error);
    throw error;
  }
}

principal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });