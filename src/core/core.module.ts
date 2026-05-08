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

export type CoreModuleOptions = {
    modules: any[];
    adapters: {
        UserProfileRepository: Type<IUserProfileRepository>;
        FacturaManagerRepository: Type<IFacturaManagerRepository>;
        QueueClientAdapter: Type<IMessagePublisher>,
        WorkTeamRepositoryAdapter: Type<IWorkTeamRepository>;
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
            WorkTeamRepositoryAdapter
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
                        WorkTeamRepositoryAdapter
                    }
                })
            ],
            exports: [
                ApplicationModule
            ],
        };
    }

}
