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
    }
}

export const USER_PROFILE_USE_CASE = 'USER_PROFILE_USE_CASE';
export const FACTURA_MANAGER_USE_CASE = 'FACTURA_MANAGER_USE_CASE';
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
            PermisosManagerRepository
        } = adapters;


        // Providers UserCases

        const UserProfileUseCaseProvider = {
            provide: USER_PROFILE_USE_CASE,
            inject: [UserProfileRepository],
            useFactory: (userProfileRepository: IUserProfileRepository) => {
                return new UserProfileAdministratorUseCase(userProfileRepository);
            }
        };

        const PermisosServiceProvider = {
            provide: PERMISOS_SERVICE,
            inject: [WorkTeamRepositoryAdapter, PermisosManagerRepository],
            useFactory: (
                workTeamRepository: IWorkTeamRepository,
                permisosManagerRepository: IPermisosManagerRepository
            ) => {
                return new PermisosService(workTeamRepository, permisosManagerRepository);
            }
        };


        const FacturaServiceProvider = {
            provide: FACTURA_SERVICE,
            inject: [PERMISOS_SERVICE, OrganizacionRepository, FacturaManagerRepository],
            useFactory: (
                permisosManagerService: IPermisosManagerService,
                organizacionRepository: IOrganizacionRepository,
                facturaRepository: IFacturaManagerRepository
            ) => {
                return new FacturaServiceImplement(permisosManagerService, organizacionRepository, facturaRepository);
            }
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
                FACTURA_SERVICE
            ],
            useFactory: (
                facturaManagerRepository: IFacturaManagerRepository,
                configService: ConfigService,
                messagePublisher: IMessagePublisher,
                userProfileRepository: IUserProfileRepository,
                workTeamRepository: IWorkTeamRepository,
                storageServiceAdapter: IStorageService,
                facturaService: IFacturaService
            ) => {
                return new FacturaManagerUseCase(
                    facturaManagerRepository,
                    userProfileRepository,
                    workTeamRepository,
                    messagePublisher,
                    configService,
                    storageServiceAdapter,
                    facturaService
                );
            }
        };

        return {
            module: ApplicationModule,
            imports: [...modules],
            providers: [UserProfileUseCaseProvider, PermisosServiceProvider, FacturaServiceProvider, FacturaManagerUseCaseProvider],
            exports: [USER_PROFILE_USE_CASE, FACTURA_MANAGER_USE_CASE, PERMISOS_SERVICE, FACTURA_SERVICE]
        }

    }

}
