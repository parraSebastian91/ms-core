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

export type ApplicationModuleOptions = {
    modules: any[];
    adapters: {
        UserProfileRepository: Type<IUserProfileRepository>;
        FacturaManagerRepository: Type<IFacturaManagerRepository>;
        QueueClientAdapter: Type<IMessagePublisher>;
        WorkTeamRepositoryAdapter: Type<IWorkTeamRepository>;
        StorageServiceAdapter: Type<IStorageService>;
    }
}

export const USER_PROFILE_USE_CASE = 'USER_PROFILE_USE_CASE';
export const FACTURA_MANAGER_USE_CASE = 'FACTURA_MANAGER_USE_CASE';


@Module({})
export class ApplicationModule {

    static register(options: ApplicationModuleOptions) {
        const { adapters, modules } = options;
        const {
            UserProfileRepository,
            FacturaManagerRepository,
            QueueClientAdapter,
            WorkTeamRepositoryAdapter,
            StorageServiceAdapter
        } = adapters;


        // Providers UserCases

        const UserProfileUseCaseProvider = {
            provide: USER_PROFILE_USE_CASE,
            inject: [UserProfileRepository],
            useFactory: (userProfileRepository: IUserProfileRepository) => {
                return new UserProfileAdministratorUseCase(userProfileRepository);
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
                StorageServiceAdapter
            ],
            useFactory: (
                facturaManagerRepository: IFacturaManagerRepository,
                configService: ConfigService,
                messagePublisher: IMessagePublisher,
                userProfileRepository: IUserProfileRepository,
                workTeamRepository: IWorkTeamRepository,
                storageServiceAdapter: IStorageService
            ) => {
                return new FacturaManagerUseCase(
                    facturaManagerRepository,
                    userProfileRepository,
                    workTeamRepository,
                    messagePublisher,
                    configService,
                    storageServiceAdapter
                );
            }
        };

        return {
            module: ApplicationModule,
            imports: [...modules],
            providers: [UserProfileUseCaseProvider, FacturaManagerUseCaseProvider],
            exports: [USER_PROFILE_USE_CASE, FACTURA_MANAGER_USE_CASE]
        }

    }

}
