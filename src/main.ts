import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
