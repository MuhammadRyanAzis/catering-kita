import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── CORS ───────────────────────────────────────────────────────────────────
  // Allow all localhost ports for local development + production domains.
  // Add your production URL to the ALLOWED_ORIGINS env variable (comma-separated)
  // e.g.  ALLOWED_ORIGINS=https://catering-kita1.vercel.app,https://yourdomain.com
  const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const allowedOrigins = [
    // ── localhost dev (any port) ──
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    // ── Production ──
    'https://catering-kita1.vercel.app',
    ...extraOrigins,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
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
  // ────────────────────────────────────────────────────────────────────────────

  // Global validation pipe so class-validator decorators work
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`\n🚀  CateringKita backend running on http://localhost:${port}\n`);
}
bootstrap();
