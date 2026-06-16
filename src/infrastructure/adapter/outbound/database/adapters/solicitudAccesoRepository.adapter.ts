import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    CrearSolicitudInput,
    ISolicitudAccesoRepository,
    ResolverSolicitudInput,
    SolicitudRow,
} from 'src/core/domain/puertos/outbound/ISolicitudAcceso.repository';

export class SolicitudAccesoRepositoryAdapter implements ISolicitudAccesoRepository {

    private readonly logger = new Logger(SolicitudAccesoRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async crearSolicitud(input: CrearSolicitudInput): Promise<{ solicitudId: number; token: string; expiraEn: string }> {

        const rows = await this.dataSource.query(
            `INSERT INTO core.organizacion_solicitud_acceso
               (organizacion_id, solicitante_uuid, rol_solicitado, mensaje)
             VALUES ($1, $2, $3, $4)
             RETURNING solicitud_id, token, expira_en`,
            [
                input.organizacionId,
                input.solicitanteUuid,
                input.rolSolicitado ?? 'COLABORADOR',
                input.mensaje ?? null,
            ],
        );

        const row = rows[0];
        this.logger.log(`[crear] solicitud_id=${row.solicitud_id} org=${input.organizacionId} user=${input.solicitanteUuid}`);
        return {
            solicitudId: Number(row.solicitud_id),
            token: row.token,
            expiraEn: row.expira_en,
        };
    }

    async existenSolicitudesPendientes(organizacionUUID: string, solicitanteUuid: string): Promise<{ orgId: number, existe: boolean }> {
        const existing = await this.dataSource.query(
            `SELECT o.organizacion_id , COUNT(*) > 0 as existe
                FROM core.organizacion_solicitud_acceso s
                JOIN core.organizacion o ON o.organizacion_id = s.organizacion_id
            WHERE o.organizacion_uuid = $1::uuid
               AND s.solicitante_uuid = $2::uuid
               AND s.estado = 'PENDIENTE'
            group by o.organizacion_id`,
            [organizacionUUID, solicitanteUuid],
        );
        return { orgId: existing.length > 0 ? existing[0].organizacion_id : null, existe: existing.length > 0 };
    }

    async crearPorUuid(
        organizacionUuid: string,
        solicitanteUuid: string,
        rolSolicitado?: string,
        mensaje?: string,
    ): Promise<{ solicitudId: number; token: string; expiraEn: string }> {
        await this.dataSource.query(`SELECT core.fn_marcar_solicitudes_expiradas()`);

        const existing = await this.dataSource.query(
            `SELECT s.solicitud_id
             FROM core.organizacion_solicitud_acceso s
             JOIN core.organizacion o ON o.organizacion_id = s.organizacion_id
             WHERE o.organizacion_uuid = $1::uuid
               AND s.solicitante_uuid = $2::uuid
               AND s.estado = 'PENDIENTE'`,
            [organizacionUuid, solicitanteUuid],
        );
        if (existing.length > 0) {
            throw new ConflictException('Ya tienes una solicitud de acceso pendiente para esta organización.');
        }

        const rows = await this.dataSource.query(
            `INSERT INTO core.organizacion_solicitud_acceso
               (organizacion_id, solicitante_uuid, rol_solicitado, mensaje)
             SELECT o.organizacion_id, $2::uuid, COALESCE($3, 'COLABORADOR'), $4
             FROM core.organizacion o
             WHERE o.organizacion_uuid = $1::uuid AND o.activo = true
             RETURNING solicitud_id, token, expira_en`,
            [organizacionUuid, solicitanteUuid, rolSolicitado ?? null, mensaje ?? null],
        );

        if (rows.length === 0) {
            throw new NotFoundException('Organización no encontrada.');
        }

        const row = rows[0];
        this.logger.log(`[crearPorUuid] solicitud_id=${row.solicitud_id} orgUuid=${organizacionUuid} user=${solicitanteUuid}`);
        return {
            solicitudId: Number(row.solicitud_id),
            token: row.token,
            expiraEn: row.expira_en,
        };
    }

    async listarPorOrganizacion(organizacionUuid: string, estado?: string): Promise<SolicitudRow[]> {
        const rows = await this.dataSource.query(
            `SELECT
               sa.solicitud_id, 
               o.organizacion_id, 
               o.razon_social as organizacion_nombre, 
               o.rut as organizacion_rut,
               sa.solicitante_uuid, 
               sa.solicitante_nombre, 
               sa.solicitante_apellido, 
               sa.solicitante_email,
               sa.rol_solicitado, 
               sa.mensaje, 
               sa.token, 
               sa.estado,
               sa.resuelto_por, 
               sa.resuelto_en, 
               sa.motivo_rechazo,
               sa.creado_en, 
               sa.expira_en, 
               sa.esta_expirada
             FROM core.v_solicitudes_acceso sa
                left JOIN core.organizacion o ON o.organizacion_id = sa.organizacion_id
             WHERE o.organizacion_uuid = $1
               AND ($2::text IS NULL OR sa.estado = $2)
             ORDER BY sa.creado_en DESC`,
            [organizacionUuid, estado ?? null],
        );
        return rows.map(this.mapRow);
    }

    async getSolicitudPorToken(token: string): Promise<SolicitudRow | null> {
        await this.dataSource.query(`SELECT core.fn_marcar_solicitudes_expiradas()`);
        const rows = await this.dataSource.query(
            `SELECT * FROM core.v_solicitudes_acceso WHERE token = $1`,
            [token],
        );
        return rows.length > 0 ? this.mapRow(rows[0]) : null;
    }

    async marcarSolicitudesExpiradas(): Promise<void> {
        await this.dataSource.query(`SELECT core.fn_marcar_solicitudes_expiradas()`);
    }

    async solveSolicitud(input: ResolverSolicitudInput): Promise<{ ok: boolean }> {
        const afected = await this.dataSource.query(
            `UPDATE core.organizacion_solicitud_acceso
             SET estado = $1, resuelto_por = $2, resuelto_en = now(), motivo_rechazo = $3
             WHERE token = $4`,
            [input.decision, input.adminUuid, input.motivoRechazo ?? null, input.token],
        );
        if (afected.length === 0) {
            throw new NotFoundException('Solicitud no encontrada o token inválido.');
        }
        return { ok: true };
    }

    async asociarUsuarioAOrganizacion(organizacionID: number, solicitanteUUID: string, rolCodigo: string, adminUUID: string): Promise<void> {
        await this.dataSource.query(
            `INSERT INTO core.organizacion_miembro
                   (organizacion_id, usuario_uuid, rol_codigo, incorporado_por)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (organizacion_id, usuario_uuid)
                   DO UPDATE SET activo = true, rol_codigo = EXCLUDED.rol_codigo,
                                 incorporado_por = EXCLUDED.incorporado_por,
                                 incorporado_en = now()`,
            [organizacionID, solicitanteUUID, rolCodigo, adminUUID],
        );
        this.logger.log(`[resolver] APROBADA org=${organizacionID} user=${solicitanteUUID} rol=${rolCodigo} admin=${adminUUID}`);
    }

    async cancelar(solicitudId: number, solicitanteUuid: string): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.organizacion_solicitud_acceso
             SET estado = 'CANCELADA'
             WHERE solicitud_id = $1 AND solicitante_uuid = $2 AND estado = 'PENDIENTE'
             RETURNING solicitud_id`,
            [solicitudId, solicitanteUuid],
        );
        if (result.length === 0) {
            throw new NotFoundException('Solicitud pendiente no encontrada para este usuario.');
        }
        return { ok: true };
    }

    private mapRow(r: any): SolicitudRow {
        return {
            solicitudId: Number(r.solicitud_id),
            organizacionId: Number(r.organizacion_id),
            organizacionNombre: r.organizacion_nombre,
            organizacionRut: r.organizacion_rut,
            solicitanteUuid: r.solicitante_uuid,
            solicitanteNombre: r.solicitante_nombre,
            solicitanteApellido: r.solicitante_apellido,
            solicitanteEmail: r.solicitante_email,
            rolSolicitado: r.rol_solicitado,
            mensaje: r.mensaje,
            token: r.token,
            estado: r.estado,
            resueltoPor: r.resuelto_por,
            resueltoEn: r.resuelto_en,
            motivoRechazo: r.motivo_rechazo,
            creadoEn: r.creado_en,
            expiraEn: r.expira_en,
            estaExpirada: r.esta_expirada,
        };
    }
}
