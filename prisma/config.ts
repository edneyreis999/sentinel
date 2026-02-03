import { PrismaClient } from '@prisma/client';

/**
 * Prisma 7 configuration
 *
 * For more information: https://pris.ly/d/prisma-client-7
 *
 * In Prisma 7, DATABASE_URL is read from process.env automatically.
 * The prisma.config.ts file configures CLI commands (migrate, studio).
 */
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
