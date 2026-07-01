/*
https://docs.nestjs.com/modules
*/

import { Inject, Module, Type } from '@nestjs/common';
import { IUserProfileRepository } from '../domain/puertos/outbound/IUserProfile.Repository';
import { UserProfileAdministratorUseCase } from './usesCase/userPofileAdministrator/UserProfileAdministrator.usecase';
import { IFacturaManagerRepository } from '../domain/puertos/outbound/IFacturaManager.repository';
import { FacturaManagerUseCase } from './usesCase/facturaManager/facturaManager.useCase';
import { IMessagePublisher } from '../domain/puertos/inbound/message.publisher.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IWorkTeamRepository } from '../domain/puertos/outbound/IWorkTeam.rerpository';
import { IStorageService } from '../domain/puertos/outbound/IStorageService.interface';
import { IFacturaService } from '../domain/puertos/inbound/IFacturaService.interface';
import { IPermisosManagerService } from '../domain/puertos/inbound/IPermisosManagerService.interface';
import { IOrganizacionRepository } from '../domain/puertos/outbound/IOrganizacion.repository';
import { IPermisosManagerRepository } from '../domain/puertos/outbound/IPermisosManager.repository';
import { FacturaServiceImplement } from './service/factura.service';
import { PermisosService } from './service/permisos.service';
import { AccesoOrganizacionUseCase } from './usesCase/organizacion/acceso.usecase';
import { ISolicitudAccesoRepository } from '../domain/puertos/outbound/ISolicitudAcceso.repository';
import { OrganizacionUseCase } from './usesCase/organizacion/organizacion.usecase';
import { TributaryService } from './service/tributary.service';
import { IVerificacionTributariaRepository } from '../domain/puertos/outbound/IVerificacionTributaria.repository';
import { storageUsecase } from './usesCase/storage/storage.usecase';
import { IStorageMediaRepository } from '../domain/puertos/outbound/IMedia.repository';
import { IFacturaCacheRepository } from '../domain/puertos/outbound/IFacturaCache.repository';

export type ApplicationModuleOptions = {
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

export const USER_PROFILE_USE_CASE = 'USER_PROFILE_USE_CASE';
export const FACTURA_MANAGER_USE_CASE = 'FACTURA_MANAGER_USE_CASE';
export const SOLICITUD_ACCESO_USECASE = 'SOLICITUD_ACCESO_USECASE';
export const ORGANIZACION_USECASE = 'ORGANIZACION_USECASE';
export const STORAGE_USECASE = 'STORAGE_USECASE';

export const PERMISOS_SERVICE = 'PERMISOS_SERVICE';
export const FACTURA_SERVICE = 'FACTURA_SERVICE';

@Module({})
export class ApplicationModule {
  static register(options: ApplicationModuleOptions) {
    const { adapters, modules } = options;
    const {
      UserProfileRepository,
      FacturaManagerRepository,
      QueueClientAdapter,
      WorkTeamRepositoryAdapter,
      StorageServiceAdapter,
      OrganizacionRepository,
      PermisosManagerRepository,
      VerificacionTributariaRepository,
      SolicitudAccesoRepository,
      StorageMediaRepository,
      TributaryService,
      FacturaCacheRepository,
    } = adapters;

    // Providers UserCases

    const UserProfileUseCaseProvider = {
      provide: USER_PROFILE_USE_CASE,
      inject: [UserProfileRepository],
      useFactory: (userProfileRepository: IUserProfileRepository) => {
        return new UserProfileAdministratorUseCase(userProfileRepository);
      },
    };

    const PermisosServiceProvider = {
      provide: PERMISOS_SERVICE,
      inject: [WorkTeamRepositoryAdapter, PermisosManagerRepository],
      useFactory: (
        workTeamRepository: IWorkTeamRepository,
        permisosManagerRepository: IPermisosManagerRepository,
      ) => {
        return new PermisosService(
          workTeamRepository,
          permisosManagerRepository,
        );
      },
    };

    const FacturaServiceProvider = {
      provide: FACTURA_SERVICE,
      inject: [
        PERMISOS_SERVICE,
        OrganizacionRepository,
        FacturaManagerRepository,
      ],
      useFactory: (
        permisosManagerService: IPermisosManagerService,
        organizacionRepository: IOrganizacionRepository,
        facturaRepository: IFacturaManagerRepository,
      ) => {
        return new FacturaServiceImplement(
          permisosManagerService,
          organizacionRepository,
          facturaRepository,
        );
      },
    };

    const FacturaManagerUseCaseProvider = {
      provide: FACTURA_MANAGER_USE_CASE,
      imports: [ConfigModule],
      inject: [
        FacturaManagerRepository,
        ConfigService,
        QueueClientAdapter,
        UserProfileRepository,
        WorkTeamRepositoryAdapter,
        StorageServiceAdapter,
        FACTURA_SERVICE,
        FacturaCacheRepository,
      ],
      useFactory: (
        facturaManagerRepository: IFacturaManagerRepository,
        configService: ConfigService,
        messagePublisher: IMessagePublisher,
        userProfileRepository: IUserProfileRepository,
        workTeamRepository: IWorkTeamRepository,
        storageServiceAdapter: IStorageService,
        facturaService: IFacturaService,
        facturaCacheRepository: IFacturaCacheRepository,
      ) => {
        return new FacturaManagerUseCase(
          facturaManagerRepository,
          userProfileRepository,
          workTeamRepository,
          messagePublisher,
          configService,
          storageServiceAdapter,
          facturaService,
          facturaCacheRepository,
        );
      },
    };

    const SolicitudAccesoUseCaseProvider = {
      provide: SOLICITUD_ACCESO_USECASE,
      inject: [SolicitudAccesoRepository],
      useFactory: (solicitudAccesoRepository: ISolicitudAccesoRepository) => {
        return new AccesoOrganizacionUseCase(solicitudAccesoRepository);
      },
    };

    const TributaryServiceProvider = {
      provide: TributaryService,
      inject: [VerificacionTributariaRepository],
      useFactory: (verificacionRepo: IVerificacionTributariaRepository) => {
        return new TributaryService(verificacionRepo);
      },
    };

    const OrganizacionUseCaseProvider = {
      provide: ORGANIZACION_USECASE,
      imports: [ConfigModule],
      inject: [
        OrganizacionRepository,
        TributaryService,
        VerificacionTributariaRepository,
        SolicitudAccesoRepository,
      ],
      useFactory: (
        organizacionRepository: IOrganizacionRepository,
        tributaryService: TributaryService,
        verificacionRepo: IVerificacionTributariaRepository,
        solicitudAccesoRepo: ISolicitudAccesoRepository,
      ) => {
        return new OrganizacionUseCase(
          organizacionRepository,
          tributaryService,
          verificacionRepo,
          solicitudAccesoRepo,
        );
      },
    };

    const StorageServiceProvider = {
      provide: STORAGE_USECASE,
      inject: [StorageMediaRepository, ConfigService],
      useFactory: (
        StorageMediaRepository: IStorageMediaRepository,
        configService: ConfigService,
      ) => {
        return new storageUsecase(StorageMediaRepository, configService);
      },
    };

    return {
      module: ApplicationModule,
      imports: [...modules],
      providers: [
        UserProfileUseCaseProvider,
        PermisosServiceProvider,
        FacturaServiceProvider,
        FacturaManagerUseCaseProvider,
        SolicitudAccesoUseCaseProvider,
        TributaryServiceProvider,
        OrganizacionUseCaseProvider,
        StorageServiceProvider,
      ],
      exports: [
        USER_PROFILE_USE_CASE,
        FACTURA_MANAGER_USE_CASE,
        PERMISOS_SERVICE,
        FACTURA_SERVICE,
        SOLICITUD_ACCESO_USECASE,
        ORGANIZACION_USECASE,
        STORAGE_USECASE,
      ],
    };
  }
}
