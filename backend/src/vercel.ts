import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let cachedApp: any;
let bootError: any;

async function bootstrap() {
  if (!cachedApp) {
    try {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      
      const extraOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : [];

      const allowedOrigins = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        'https://catering-kita.vercel.app',
        ...extraOrigins,
      ];

      app.enableCors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const allowed = allowedOrigins.some((o) =>
            o instanceof RegExp ? o.test(origin) : o === origin,
          );
          if (allowed) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      });

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      await app.init();
      cachedApp = app;
    } catch (error) {
      console.error('Bootstrap Error:', error);
      bootError = error;
    }
  }
  return cachedApp;
}

const handler = async (req: any, res: any) => {
  await bootstrap();
  if (bootError) {
    return res.status(500).json({
      message: 'CRITICAL ERROR: NestJS Server Failed to Start',
      errorName: bootError.name,
      errorMessage: bootError.message,
      errorStack: bootError.stack
    });
  }
  server(req, res);
};

export = handler;
