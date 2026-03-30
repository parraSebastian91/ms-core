/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

export type DomainModuleOptions = {
    modules: any[];
    adapters: {
    }
}

@Module({})
export class DomainModule {

    static register(options: DomainModuleOptions) {
        const { adapters, modules } = options;
        const {

        } = adapters;

        return {
            module: DomainModule,
            imports: [...modules],
            providers: [],
            exports: []
        }
    }
}
