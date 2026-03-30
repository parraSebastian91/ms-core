/*
https://docs.nestjs.com/modules
*/

import { DynamicModule, Inject, Module, Type } from '@nestjs/common';
import { IUsuarioRepository } from './domain/puertos/outbound/iUsuarioRepository.interface';
import { IContactoRepository } from './domain/puertos/outbound/iContactoRepository.interface';
import { ITipoContactoRepository } from './domain/puertos/outbound/iTipoContactoRepository.interface';
import { IRolRepository } from './domain/puertos/outbound/iRolRepository.interface';
import { ISistemaRepository } from './domain/puertos/outbound/ISistemaRepository.interface';
import { IUserProfileRepository } from './domain/puertos/outbound/IUserProfile.Repository';

export type CoreModuleOptions = {
    modules: any[];
    adapters: {
        usuarioRepository: Type<IUsuarioRepository>;
        contactoRepository: Type<IContactoRepository>;
        tipoContactoRepository: Type<ITipoContactoRepository>;
        rolRepository: Type<IRolRepository>;
        sistemaRepository: Type<ISistemaRepository>;
        UserProfileRepository: Type<IUserProfileRepository>;
    }
}



@Module({})
export class CoreModule {

    static register(options: CoreModuleOptions): DynamicModule {
        const { adapters, modules } = options;
        const { usuarioRepository, contactoRepository, rolRepository, sistemaRepository, UserProfileRepository } = adapters;

        


        return {
            module: CoreModule,
            global: true,
            imports: [
                ...modules,
            ],
            providers: [
                
            ],
            exports: [
                
            ],
        };
    }

}
