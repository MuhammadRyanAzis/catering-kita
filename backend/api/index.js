const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { AppModule } = require('../dist/src/app.module');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');

const server = express();
let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    
    // Setup CORS
    app.enableCors({ origin: '*' });
    
    // Setup Validation
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      transform: true 
    }));

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

module.exports = async (req, res) => {
  try {
    await bootstrap();
    server(req, res);
  } catch (err) {
    console.error('NestJS Bootstrap Error:', err);
    res.status(500).json({ 
      error: 'Failed to start NestJS', 
      message: err.message,
      stack: err.stack
    });
  }
};
