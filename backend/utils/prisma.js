import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty'
});

if (process.env.ENTORNO_NODO !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection function
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    return false;
  }
};

// Graceful disconnect
process.on('beforeExit', async () => {
  console.log('🔌 Desconectando de la base de datos...');
  await prisma.$disconnect();
});

export { prisma };