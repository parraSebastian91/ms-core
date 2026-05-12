/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, HttpStatus, Inject, Logger, Param, Req, Res, UseFilters } from '@nestjs/common';
import { Permissions } from '../decorators/permissions.decorator';
import { IFacturaManager } from 'src/core/domain/puertos/inbound/IFacturaPublisher.interface';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { Request, Response } from 'express';
import { ApiResponse } from '../model/api-response.model';
import { UserProfileDTO } from '../model/dto/userProfile.response.dto';

const permisosControlador =
{
    VER_FACTURA: "FCT_VEW",
    CREAR_FACTURA: "FCT_CREATE",
    EDITAR_FACTURA: "FCT_EDIT",
    ELIMINAR_FACTURA: "FCT_DELETE",
    READ_ONLY: "READ_ONLY"
}
@Controller('factura')
@UseFilters(CoreExceptionFilter)
export class FacturaManagerController {

    private readonly logger = new Logger(FacturaManagerController.name);

    constructor(@Inject('FACTURA_MANAGER_USE_CASE') private readonly facturaManager: IFacturaManager) { }

    /**
     * 
     * @param uuid Identificador de usuario
     * @returns 
     */
    @Get("list/:usuario/:orgUUID")
    @Permissions(permisosControlador.VER_FACTURA, permisosControlador.READ_ONLY)
    async getFacturas(
        @Param("usuario") usuario: string,
        @Param("orgUUID") orgUUID: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        const initDAte = new Date();
        this.logger.log(`[START] getFacturas - Usuario: ${usuario}, Organización: ${orgUUID}`);

        const facturas = await this.facturaManager.getFacturas(usuario, orgUUID);

        const endDate = new Date();
        const duration = endDate.getTime() - initDAte.getTime();
        this.logger.log(`[END] getFacturas - Usuario: ${usuario}, Organización: ${orgUUID}, Duración: ${duration}ms`);
        this.logger.debug(`Facturas obtenidas para usuario ${usuario} y organización ${orgUUID}: ${JSON.stringify(facturas)}`);
        return response.status(200).json(new ApiResponse(HttpStatus.OK, "Extracción exitosa", facturas));        
    }

}
