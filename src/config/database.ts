import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Log all queries in development
// TODO: Fix TypeScript types for Prisma query logging
// prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
//   if (process.env.NODE_ENV === 'development') {
//     logger.debug(`Query: ${e.query}`);
//     logger.debug(`Params: ${e.params}`);
//     logger.debug(`Duration: ${e.duration}ms`);
//   }
// });

// Handle database connection errors
prisma.$use(async (params: any, next: (params: any) => Promise<any>) => {
  try {
    return await next(params);
  } catch (error) {
    logger.error('Database error:', error);
    throw error;
  }
});

export default prisma;
