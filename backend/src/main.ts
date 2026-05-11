import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the production frontend can reach the backend
  app.enableCors({
    origin: ['https://catering-kita1.vercel.app'],
    credentials: true,
  });

  // Enable global validation pipe so class-validator decorators work
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 5050);
}
bootstrap();
