import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './infrastructure/adapter/inbound/http-server/pipes/validation.pipe';

import * as vault from 'node-vault';

async function preloadVaultToEnv() {

  const clientValores = {
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  }
  const client = vault(clientValores);

  const paths = ['JWT', 'DB-SEIS-POSTGRES', 'REDIS', 'SHARED'];

  for (const path of paths) {
    try {
      const res = await client.read(`secret/data/${path}`);
      const data = res?.data?.data ?? {};
      for (const [k, v] of Object.entries(data)) {
        const envKey = String(k).toUpperCase();
        if (!process.env[envKey] && v !== undefined && v !== null) {
          process.env[envKey] = String(v);
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'production') throw e;
    }
  }
}
async function bootstrap() {
  await preloadVaultToEnv();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000).then(() => {
    console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
