import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Add error handling for database connection failure
prisma.$connect().catch((error) => {
  console.error('Database connection error:', error);
  process.exit(1);
});

// Add error handling for database query failure
prisma.$on('query', (e) => {
  if (e.error) {
    console.error('Database query error:', e.error);
  }
});
