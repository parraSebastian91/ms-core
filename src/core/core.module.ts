/*
https://docs.nestjs.com/modules
*/

import { DynamicModule, Module, Type } from '@nestjs/common';
import { IUserProfileRepository } from './domain/puertos/outbound/IUserProfile.Repository';
import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { IMessagePublisher } from './domain/puertos/inbound/message.publisher.interface';
import { IFacturaManagerRepository } from './domain/puertos/outbound/IFacturaManager.repository';
import { IWorkTeamRepository } from './domain/puertos/outbound/IWorkTeam.rerpository';
import { IStorageService } from './domain/puertos/outbound/IStorageService.interface';
import { IOrganizacionRepository } from './domain/puertos/outbound/IOrganizacion.repository';
import { IPermisosManagerRepository } from './domain/puertos/outbound/IPermisosManager.repository';
import { ISolicitudAccesoRepository } from './domain/puertos/outbound/ISolicitudAcceso.repository';
import { TributaryService } from './application/service/tributary.service';
import { IVerificacionTributariaRepository } from './domain/puertos/outbound/IVerificacionTributaria.repository';
import { IStorageMediaRepository } from './domain/puertos/outbound/IMedia.repository';
import { IFacturaCacheRepository } from './domain/puertos/outbound/IFacturaCache.repository';

export type CoreModuleOptions = {
  modules: any[];
  adapters: {
    UserProfileRepository: Type<IUserProfileRepository>;
    FacturaManagerRepository: Type<IFacturaManagerRepository>;
    QueueClientAdapter: Type<IMessagePublisher>;
    WorkTeamRepositoryAdapter: Type<IWorkTeamRepository>;
    StorageServiceAdapter: Type<IStorageService>;
    OrganizacionRepository: Type<IOrganizacionRepository>;
    PermisosManagerRepository: Type<IPermisosManagerRepository>;
    SolicitudAccesoRepository: Type<ISolicitudAccesoRepository>;
    VerificacionTributariaRepository: Type<IVerificacionTributariaRepository>;
    TributaryService: Type<TributaryService>;
    StorageMediaRepository: Type<IStorageMediaRepository>;
    FacturaCacheRepository: Type<IFacturaCacheRepository>;
  };
};

@Module({})
export class CoreModule {
  static register(options: CoreModuleOptions): DynamicModule {
    const { adapters, modules } = options;
    const {
      UserProfileRepository,
      FacturaManagerRepository,
      QueueClientAdapter,
      WorkTeamRepositoryAdapter,
      StorageServiceAdapter,
      OrganizacionRepository,
      PermisosManagerRepository,
      SolicitudAccesoRepository,
      VerificacionTributariaRepository,
      TributaryService,
      StorageMediaRepository,
      FacturaCacheRepository,
    } = adapters;

    return {
      module: CoreModule,
      global: true,
      imports: [
        ...modules,
        DomainModule,
        ApplicationModule.register({
          modules,
          adapters: {
            UserProfileRepository,
            FacturaManagerRepository,
            QueueClientAdapter,
            WorkTeamRepositoryAdapter,
            StorageServiceAdapter,
            OrganizacionRepository,
            PermisosManagerRepository,
            SolicitudAccesoRepository,
            VerificacionTributariaRepository,
            TributaryService,
            StorageMediaRepository,
            FacturaCacheRepository
          },
        }),
      ],
      exports: [ApplicationModule],
    };
  }
}
