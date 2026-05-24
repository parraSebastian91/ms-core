

import { Module } from '@nestjs/common';
import { InfraestructureModule } from './infrastructure/Infraestructure.module';
import { CoreModule } from './core/core.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configurations from 'config/configurations';
import { UserProfileRepositoryAdapter } from './infrastructure/adapter/outbound/database/adapters/userProfileRepository.adapter';
import { QueueClientAdapter } from './infrastructure/adapter/outbound/queue/queue-client.adapter';
import { FacturaRepositoryAdapter } from './infrastructure/adapter/outbound/database/adapters/facturaRepository.adapter';
import { WorkTeamRepositoryAdapter } from './infrastructure/adapter/outbound/database/adapters/workTeamRepositori.adapter';
import { StorageServiceAdapter } from './infrastructure/adapter/outbound/external-Service/storageService.adapter';
import { organizacionRepositoriAdapter } from './infrastructure/adapter/outbound/database/adapters/organizacionRepository.adapter';
import { PermisosRepositoryAdapter } from './infrastructure/adapter/outbound/database/adapters/permisosManagerRepository.adapter';

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
        FacturaManagerRepository: FacturaRepositoryAdapter,
        QueueClientAdapter: QueueClientAdapter,
        WorkTeamRepositoryAdapter: WorkTeamRepositoryAdapter,
        StorageServiceAdapter: StorageServiceAdapter,
        OrganizacionRepository: organizacionRepositoriAdapter,
        PermisosManagerRepository: PermisosRepositoryAdapter
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
      signOptions: { expiresIn: '1h' },
    }),
  ]
})
export class AppModule { }
