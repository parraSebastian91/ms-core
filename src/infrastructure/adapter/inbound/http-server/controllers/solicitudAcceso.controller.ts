import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    Res,
    UseFilters,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
    ISolicitudAccesoRepository,
    SOLICITUD_ACCESO_REPOSITORY,
} from 'src/core/domain/puertos/outbound/ISolicitudAcceso.repository';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { ApiResponse } from '../model/api-response.model';
import { Public } from '../decorators/public.decorator';
import { ISolicitudeAcceso } from 'src/core/domain/puertos/inbound/ISolicitudeAcceso.Interface';
import { SOLICITUD_ACCESO_USECASE } from 'src/core/application/application.module';

class CrearSolicitudDto {
    /** UUID del usuario que solicita acceso */
    solicitanteUuid: string;
    /** Rol que solicita: COLABORADOR | OPERADOR */
    rolSolicitado?: string;
    /** Mensaje libre para el admin */
    mensaje?: string;
}

class ResolverSolicitudDto {
    /** UUID del admin que resuelve */

    adminUuid: string;
    decision: 'APROBADA' | 'RECHAZADA';
    motivoRechazo?: string;
}

@Controller('organizacion')
@UseFilters(CoreExceptionFilter)
export class SolicitudAccesoController {

    private readonly logger = new Logger(SolicitudAccesoController.name);

    constructor(
        @Inject(SOLICITUD_ACCESO_USECASE) private readonly solucitudAcceso: ISolicitudeAcceso,
    ) { }

    /**
     * POST /organizacion/:id/solicitud-acceso
     * El colaborador solicita unirse a la organización.
     */
    @Post(':id/solicitud-acceso')
    async crear(
        @Param('id', ParseUUIDPipe) organizacionUuid: string,
        @Body() body: CrearSolicitudDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] solicitud-acceso org=${organizacionUuid} user=${body.solicitanteUuid}`);
        const result = await this.solucitudAcceso.ExecuteSolicitarAcceso(organizacionUuid, body.solicitanteUuid, body.rolSolicitado, body.mensaje);
        return res.status(HttpStatus.CREATED).json(
            new ApiResponse(HttpStatus.CREATED, 'Solicitud de acceso creada. El administrador recibirá una notificación.', result),
        );
    }

    /**
     * GET /organizacion/:id/solicitudes-acceso?estado=PENDIENTE
     * Panel del admin — lista todas las solicitudes de su organización.
     */
    @Get(':id/solicitudes-acceso')
    async listar(
        @Param('id', ParseUUIDPipe) organizacionUuid: string,
        @Query('estado') estado: string | undefined,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] solicitudes-acceso org=${organizacionUuid} estado=${estado ?? 'all'}`);
        const data = await this.solucitudAcceso.ExecuteListarSolicitudes(organizacionUuid, estado);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Solicitudes obtenidas', data),
        );
    }

    /**
     * GET /organizacion/solicitud-acceso/:token
     * Resuelve una solicitud por su token (link de email o QR).
     */
    @Get('solicitud-acceso/:token')
    @Public()
    async obtenerPorToken(
        @Param('token') token: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] solicitud-acceso token=${token.slice(0, 8)}…`);
        const data = await this.solucitudAcceso.ExecuteObtenerPorToken(token);
        if (!data) {
            return res.status(HttpStatus.NOT_FOUND).json(
                new ApiResponse(HttpStatus.NOT_FOUND, 'Solicitud no encontrada o token inválido.', null),
            );
        }
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Solicitud encontrada', data),
        );
    }

    /**
     * POST /organizacion/solicitud-acceso/:token/resolver
     * Admin aprueba o rechaza desde el panel o desde el link de email.
     */
    @Post('solicitud-acceso/:token/resolver')
    async resolver(
        @Param('token') token: string,
        @Body() body: ResolverSolicitudDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] resolver token=${token.slice(0, 8)}… decision=${body.decision} admin=${body.adminUuid}`);
        const result = await this.solucitudAcceso.ExecuteResolverSolicitud({
            token,
            adminUuid: body.adminUuid,
            decision: body.decision,
            motivoRechazo: body.motivoRechazo,
        });
        const msg = body.decision === 'APROBADA'
            ? 'Solicitud aprobada. El colaborador fue añadido a la organización.'
            : 'Solicitud rechazada.';
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, msg, result),
        );
    }

    /**
     * DELETE /organizacion/solicitud-acceso/:id/cancelar
     * El colaborador cancela su propia solicitud pendiente.
     * Body: { solicitanteUuid }
     */
    @Delete('solicitud-acceso/:id/cancelar')
    async cancelar(
        @Param('id', ParseIntPipe) solicitudId: number,
        @Body() body: { solicitanteUuid: string },
        @Res() res: Response,
    ) {
        this.logger.log(`[DELETE] cancelar solicitud_id=${solicitudId} user=${body.solicitanteUuid}`);
        const result = await this.solucitudAcceso.ExecuteCancelarSolicitud(solicitudId, body.solicitanteUuid);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Solicitud cancelada.', result),
        );
    }

    /**
     * POST /organizacion/uuid/:uuid/solicitud-ingreso
     * Un usuario solicita unirse a una organización identificada por UUID.
     * Body: { solicitanteUuid, rolSolicitado?, mensaje? }
     */
    @Post('uuid/:uuid/solicitud-ingreso')
    @Public()
    async crearPorUuid(
        @Param('uuid') uuid: string,
        @Body() body: { solicitanteUuid: string; rolSolicitado?: string; mensaje?: string },
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] uuid/${uuid}/solicitud-ingreso | solicitante=${body.solicitanteUuid}`);
        const result = await this.solucitudAcceso.ExecuteSolicitarAcceso(uuid, body.solicitanteUuid, body.rolSolicitado, body.mensaje);
        return res.status(HttpStatus.CREATED).json(
            new ApiResponse(HttpStatus.CREATED, 'Solicitud de ingreso creada.', result),
        );
    }
}
