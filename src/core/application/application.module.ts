/*
https://docs.nestjs.com/modules
*/

import { Inject, Module, Type } from '@nestjs/common';
import { IUserProfileRepository } from '../domain/puertos/outbound/IUserProfile.Repository';
import { UserProfileAdministratorUseCase } from './usesCase/userPofileAdministrator/UserProfileAdministrator.usecase';

export type ApplicationModuleOptions = {
    modules: any[];
    adapters: {
        UserProfileRepository: Type<IUserProfileRepository>;
    }
}

export const USER_PROFILE_USE_CASE = 'USER_PROFILE_USE_CASE';


@Module({})
export class ApplicationModule {

    static register(options: ApplicationModuleOptions) {
        const { adapters, modules } = options;
        const {
            UserProfileRepository,
        } = adapters;


        // Providers UserCases

        const UserProfileUseCaseProvider = {
            provide: USER_PROFILE_USE_CASE,
            inject: [UserProfileRepository],
            useFactory: (userProfileRepository: IUserProfileRepository) => {
                return new UserProfileAdministratorUseCase(userProfileRepository);
            }
        };

        return {
            module: ApplicationModule,
            imports: [...modules],
            providers: [UserProfileUseCaseProvider],
            exports: [USER_PROFILE_USE_CASE]
        }

    }

}
