import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 Configuration
 *
 * According to Prisma 7 best practices:
 * - Config file should be at project root (where package.json is)
 * - dotenv/config must be imported BEFORE defineConfig
 * - datasource.url should use process.env directly
 *
 * @see https://medium.com/@msmiraj8/get-started-with-prisma-7-with-nest-js-mysql-3919eaa7c760
 * @see https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
