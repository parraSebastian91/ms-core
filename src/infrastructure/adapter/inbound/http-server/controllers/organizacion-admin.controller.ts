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
    Patch,
    Post,
    Query,
    Res,
    UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import {
    IOrganizacionAdminRepository,
    ORGANIZACION_ADMIN_REPOSITORY,
} from 'src/core/domain/puertos/outbound/IOrganizacionAdmin.repository';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { ApiResponse } from '../model/api-response.model';

class CambiarRolDto {
    rolCodigo: string;
}

class CrearGrupoDto {
    nombre: string;
    descripcion?: string;
    liderUuid: string;
}

class ActualizarGrupoDto {
    nombre: string;
    descripcion?: string;
}

class AgregarMiembroGrupoDto {
    usuarioUuid: string;
    cargoEnGrupo?: string;
}

class GenerarTokenDto {
    adminUuid: string;
    rolDestino?: string;
}

@Controller('organizacion')
@UseFilters(CoreExceptionFilter)
export class OrganizacionAdminController {

    private readonly logger = new Logger(OrganizacionAdminController.name);

    constructor(
        @Inject(ORGANIZACION_ADMIN_REPOSITORY)
        private readonly repo: IOrganizacionAdminRepository,
    ) { }

    // ── Datos básicos ─────────────────────────────────────────────────────────

    /** GET /organizacion/:id */
    @Get(':id')
    async getOrganizacion(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] organizacion uuid=${organizacionUUID}`);
        const data = await this.repo.getOrganizacionById(organizacionUUID);
        if (!data) {
            return res.status(HttpStatus.NOT_FOUND).json(
                new ApiResponse(HttpStatus.NOT_FOUND, 'Organización no encontrada', null),
            );
        }
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Organización obtenida', data),
        );
    }

    /** GET /organizacion/:id/mi-rol?usuarioUuid=... */
    @Get(':id/mi-rol')
    async getMiRol(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Query('usuarioUuid') usuarioUuid: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] mi-rol org=${organizacionUUID} user=${usuarioUuid}`);
        if (!usuarioUuid) {
            return res.status(HttpStatus.BAD_REQUEST).json(
                new ApiResponse(HttpStatus.BAD_REQUEST, 'usuarioUuid es requerido', null),
            );
        }
        const rol = await this.repo.getRolMiembro(organizacionUUID, usuarioUuid);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Rol obtenido', { rol }),
        );
    }

    // ── Miembros ──────────────────────────────────────────────────────────────

    /** GET /organizacion/:id/miembros */
    @Get(':id/miembros')
    async listarMiembros(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] miembros org=${organizacionUUID}`);
        const data = await this.repo.listarMiembros(organizacionUUID);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Miembros obtenidos', data),
        );
    }

    /** PATCH /organizacion/:id/miembros/:uuid/rol */
    @Patch(':id/miembros/:uuid/rol')
    async cambiarRol(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Param('uuid', ParseUUIDPipe) usuarioUuid: string,
        @Body() body: CambiarRolDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[PATCH] cambiarRol org=${organizacionUUID} user=${usuarioUuid} rol=${body.rolCodigo}`);
        const result = await this.repo.cambiarRolMiembro(organizacionUUID, usuarioUuid, body.rolCodigo);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Rol actualizado', result),
        );
    }

    /** DELETE /organizacion/:id/miembros/:uuid */
    @Delete(':id/miembros/:uuid')
    async removerMiembro(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Param('uuid', ParseUUIDPipe) usuarioUuid: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[DELETE] removerMiembro org=${organizacionUUID} user=${usuarioUuid}`);
        const result = await this.repo.removerMiembro(organizacionUUID, usuarioUuid);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Miembro removido de la organización', result),
        );
    }

    // ── Grupos de trabajo ─────────────────────────────────────────────────────

    /** GET /organizacion/:id/grupos */
    @Get(':id/grupos')
    async listarGrupos(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] grupos org=${organizacionUUID}`);
        const data = await this.repo.listarGrupos(organizacionUUID);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Grupos obtenidos', data),
        );
    }

    /** POST /organizacion/:id/grupos */
    @Post(':id/grupos')
    async crearGrupo(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Body() body: CrearGrupoDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] crearGrupo org=${organizacionUUID} nombre=${body.nombre}`);
        const result = await this.repo.crearGrupo({
            organizacionUUID,
            nombre: body.nombre,
            descripcion: body.descripcion,
            liderUuid: body.liderUuid,
        });
        return res.status(HttpStatus.CREATED).json(
            new ApiResponse(HttpStatus.CREATED, 'Grupo creado', result),
        );
    }

    /** PATCH /organizacion/grupos/:grupoId */
    @Patch('grupos/:grupoId')
    async actualizarGrupo(
        @Param('grupoId', ParseUUIDPipe) grupoId: string,
        @Body() body: ActualizarGrupoDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[PATCH] actualizarGrupo grupo=${grupoId}`);
        const result = await this.repo.actualizarGrupo(grupoId, body.nombre, body.descripcion);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Grupo actualizado', result),
        );
    }

    /** DELETE /organizacion/grupos/:grupoId */
    @Delete('grupos/:grupoId')
    async eliminarGrupo(
        @Param('grupoId', ParseUUIDPipe) grupoId: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[DELETE] eliminarGrupo grupo=${grupoId}`);
        const result = await this.repo.eliminarGrupo(grupoId);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Grupo eliminado', result),
        );
    }

    /** POST /organizacion/grupos/:grupoId/miembros */
    @Post('grupos/:grupoId/miembros')
    async agregarMiembro(
        @Param('grupoId', ParseUUIDPipe) grupoId: string,
        @Body() body: AgregarMiembroGrupoDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] agregarMiembro grupo=${grupoId} user=${body.usuarioUuid}`);
        const result = await this.repo.agregarMiembroGrupo(grupoId, body.usuarioUuid, body.cargoEnGrupo);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Miembro agregado al grupo', result),
        );
    }

    /** DELETE /organizacion/grupos/:grupoId/miembros/:uuid */
    @Delete('grupos/:grupoId/miembros/:uuid')
    async removerMiembroGrupo(
        @Param('grupoId', ParseUUIDPipe) grupoId: string,
        @Param('uuid', ParseUUIDPipe) usuarioUuid: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[DELETE] removerMiembroGrupo grupo=${grupoId} user=${usuarioUuid}`);
        const result = await this.repo.removerMiembroGrupo(grupoId, usuarioUuid);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Miembro removido del grupo', result),
        );
    }

    // ── Enrolamiento ──────────────────────────────────────────────────────────

    /** POST /organizacion/:id/generar-token-enrolamiento */
    @Post(':id/generar-token-enrolamiento')
    async generarToken(
        @Param('id', ParseUUIDPipe) organizacionUUID: string,
        @Body() body: GenerarTokenDto,
        @Res() res: Response,
    ) {
        this.logger.log(`[POST] generarToken org=${organizacionUUID} admin=${body.adminUuid}`);
        const result = await this.repo.generarTokenEnrolamiento(
            organizacionUUID,
            body.adminUuid,
            body.rolDestino,
        );
        return res.status(HttpStatus.CREATED).json(
            new ApiResponse(HttpStatus.CREATED, 'Token de enrolamiento generado', result),
        );
    }
}
