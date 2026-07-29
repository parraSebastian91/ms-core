import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './infrastructure/adapter/inbound/http-server/pipes/validation.pipe';
import { register } from 'prom-client';

// Limpiar registry de Prometheus para evitar "metric already registered"
register.clear();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Configurar CORS
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
  
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://192.168.3.10:4200', // PC-Dev
      FRONTEND_ORIGIN,
    ].filter(Boolean),
    credentials: true,
    exposedHeaders: ['Set-Cookie', 'x-request-id'],
    allowedHeaders: [
      'Content-Type',
      'Origin',
      'Accept',
      'Authorization',
      'x-request-id',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await app.listen(process.env.PORT ?? 2001).then(() => {
    console.log(`Application is running on: ${process.env.PORT ?? 2001}`);
  });
}
bootstrap();
