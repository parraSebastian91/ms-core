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

export type CoreModuleOptions = {
    modules: any[];
    adapters: {
        UserProfileRepository: Type<IUserProfileRepository>;
        FacturaManagerRepository: Type<IFacturaManagerRepository>;
        QueueClientAdapter: Type<IMessagePublisher>,
        WorkTeamRepositoryAdapter: Type<IWorkTeamRepository>;
        StorageServiceAdapter: Type<IStorageService>;
        OrganizacionRepository: Type<IOrganizacionRepository>;
        PermisosManagerRepository: Type<IPermisosManagerRepository>;
    }
}



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
            PermisosManagerRepository
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
                        PermisosManagerRepository
                    }
                })
            ],
            exports: [
                ApplicationModule
            ],
        };
    }

}
