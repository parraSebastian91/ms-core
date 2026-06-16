import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    Res,
    UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { ApiResponse } from '../model/api-response.model';
import { Public } from '../decorators/public.decorator';
import { IOrganizacionAdministrator } from 'src/core/domain/puertos/inbound/IOrganizacionAdministrator';
import { CrearOrganizacionDto, GuardarVerificacionDto } from '../model/dto/organizacion.dto';
import { OrganizacionModel } from 'src/core/domain/model/organizacion.model';
import { ORGANIZACION_USECASE } from 'src/core/application/application.module';
import { Permissions } from '../decorators/permissions.decorator';



@Controller('organizacion')
@UseFilters(CoreExceptionFilter)
export class OrganizacionController {

    private readonly logger = new Logger(OrganizacionController.name);

    constructor(
        @Inject(ORGANIZACION_USECASE) private readonly organizacionUseCase: IOrganizacionAdministrator,
    ) { }

    /**
     * POST /organizacion
     * Crea el registro base de una organización.
     * Idempotente: si ya existe el RUT retorna el registro existente.
     */
    @Post()
    @Permissions('ORG_CREATE')
    async crearOrganizacion(
        @Body() body: any, //CrearOrganizacionDto
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] /organizacion razonSocial=${body.razonSocial} rut=${body.rut}`);
        console.log("Request body:", body);
        const orgModel = OrganizacionModel.build()
            .setRazonSocial(body.razonSocial)
            .setTipoOrganizacion(body.tipoPersona)
            .setRut(body.rut)
            .setTipoParticipante(body.tipoParticipacion)
            .setGiros(body.giros ?? [])
            .setRawSii(body.rawSii ?? null)
            .build();

        const usuario = req['user'] || null;
        console.log("Usuario en request:", usuario);
        const result = await this.organizacionUseCase.createOrganizacion(orgModel, usuario);
        const status = HttpStatus.CREATED;
        return res.status(status).json(
            new ApiResponse(status, 'Organización creada', result),
        );
    }

    /**
     * POST /organizacion/verificacion-tributaria
     * Llamado exclusivamente por el BFF después de consultar al organismo fiscal.
     * Normaliza y persiste los datos tributarios de la organización.
     */
    @Post('verificacion-tributaria')
    async guardarVerificacion(
        @Body() body: GuardarVerificacionDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] verificacion-tributaria | orgId=${body.organizacionId} | fuente=${body.fuente}`);
        await this.organizacionUseCase.guardarVerificacion(body);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Verificación tributaria guardada', null),
        );
    }

    /**
     * GET /organizacion/check-rut?rut=178414453
     * Verifica si ya existe una organización con ese RUT en la plataforma.
     * Parámetro rut: dígitos + DV concatenados sin puntos ni guión (ej: "178414453" o "1234567K").
     */
    @Get('check-rut')
    async checkRut(
        @Query('rut') rut: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] check-rut | rut=${rut?.slice(0, 6)}…`);
        const result = await this.organizacionUseCase.checkRut(rut);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'RUT ya registrado', result),
        );
    }

    /**
     * GET /organizacion/:id/verificacion-tributaria
     * Retorna el estado tributario vigente de la organización.
     */
    @Get(':id/verificacion-tributaria')
    async getVerificacion(
        @Param('id', ParseIntPipe) organizacionId: number,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] verificacion-tributaria | orgId=${organizacionId}`);
        const data = await this.organizacionUseCase.getVerificacionTributaria(organizacionId);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Verificación tributaria', data),
        );
    }
}
