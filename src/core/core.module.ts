/*
https://docs.nestjs.com/modules
*/

import { DynamicModule, Module, Type } from '@nestjs/common';
import { IUserProfileRepository } from './domain/puertos/outbound/IUserProfile.Repository';
import { UserProfileAdministratorUseCase } from './application/usesCase/userPofileAdministrator/UserProfileAdministrator.usecase';
import { ApplicationModule } from './application/application.module';
import { Domain } from 'domain';
import { DomainModule } from './domain/domain.module';

export type CoreModuleOptions = {
    modules: any[];
    adapters: {
        UserProfileRepository: Type<IUserProfileRepository>;
    }
}



@Module({})
export class CoreModule {

    static register(options: CoreModuleOptions): DynamicModule {
        const { adapters, modules } = options;
        const { UserProfileRepository } = adapters;

        return {
            module: CoreModule,
            global: true,
            imports: [
                ...modules,
                DomainModule,
                ApplicationModule.register({
                    modules,
                    adapters: {
                        UserProfileRepository
                    }
                })
            ],
            exports: [
                ApplicationModule
            ],
        };
    }

}
