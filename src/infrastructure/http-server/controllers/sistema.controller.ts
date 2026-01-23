/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Inject, Param, UseFilters } from '@nestjs/common';
import { ISistemaAplicationService } from 'src/core/aplication/sistema/ISistemaAplication.interface';
import { SISTEMA_APLICATION } from 'src/core/core.module';
import { SistemaDTO } from 'src/core/domain/DTO/sistema.dto';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('sistema')
@UseFilters(CoreExceptionFilter)
export class SistemaController { 

    constructor(@Inject(SISTEMA_APLICATION) private sistemaAplicationService: ISistemaAplicationService) { }
    @Get(':username')
    @Permissions('MENU_VIEW', 'SYS_ADMIN')
    async getSistemaByUsername(@Param('username') username: string): Promise<SistemaDTO | null> {
        return this.sistemaAplicationService.getSistemaByUsername(username);
    }

}
