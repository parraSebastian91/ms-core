

import { Module } from '@nestjs/common';
import { InfraestructureModule } from './infrastructure/Infraestructure.module';
import { CoreModule } from './core/core.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configurations from 'config/configurations';
import { UserProfileRepositoryAdapter } from './infrastructure/adapter/userProfileRepository.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
      envFilePath: ['.env', '.env.container'],
    }),
    CoreModule.register({
      modules: [InfraestructureModule],
      adapters: {
          UserProfileRepository: UserProfileRepositoryAdapter,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
      signOptions: { expiresIn: '1h' },
    }),
  ]
})
export class AppModule { }
