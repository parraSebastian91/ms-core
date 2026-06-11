import {
    ConflictException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    CrearGrupoInput,
    GrupoMiembroRow,
    GrupoRow,
    IOrganizacionAdminRepository,
    OrgBasicData,
    OrgMiembroRow,
} from 'src/core/domain/puertos/outbound/IOrganizacionAdmin.repository';

export class OrganizacionAdminRepositoryAdapter implements IOrganizacionAdminRepository {

    private readonly logger = new Logger(OrganizacionAdminRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    // ─────────────────────────────────────────────────────────────────────────
    // DATOS BÁSICOS DE LA ORG
    // ─────────────────────────────────────────────────────────────────────────

    async getOrganizacionById(organizacionUUID: string): Promise<OrgBasicData | null> {
        const rows = await this.dataSource.query(
            `SELECT organizacion_id, razon_social, giro, rut, dv
             FROM core.organizacion
             WHERE organizacion_uuid = $1 AND activo = true`,
            [organizacionUUID],
        );
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            organizacionID: Number(r.organizacion_id),
            organizacionUUID: organizacionUUID,
            razonSocial: r.razon_social,
            descripcion: r.giro ?? null,
            logoUrl: null, // TODO: obtener desde MinIO cuando esté disponible
            rut: r.rut,
            dv: r.dv,
        };
    }

    async getRolMiembro(organizacionUUID: string, usuarioUuid: string): Promise<string | null> {
        const rows = await this.dataSource.query(
            `SELECT rol_codigo
            FROM core.organizacion_miembro om 
                    left join core.organizacion o 
                        on o.organizacion_id = om.organizacion_id 
             WHERE o.organizacion_uuid = $1
               AND om.usuario_uuid    = $2
               AND om.activo          = true`,
            [organizacionUUID, usuarioUuid],
        );
        return rows.length > 0 ? (rows[0].rol_codigo as string) : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MIEMBROS
    // ─────────────────────────────────────────────────────────────────────────

    async listarMiembros(organizacionUUID: string): Promise<OrgMiembroRow[]> {
        const rows = await this.dataSource.query(
            `SELECT
               om.miembro_id,
               om.usuario_uuid,
               c.nombres                 AS nombre,
               c.apellido_paterno        AS apellido,
               c.correo                  AS email,
               NULL                      AS avatar_url,
               om.rol_codigo,
               rc.nombre                 AS rol_nombre,
               om.incorporado_en
             FROM core.organizacion_miembro om
             left join core.organizacion o 
                        on o.organizacion_id = om.organizacion_id 
             JOIN core.usuario u  ON u.usuario_uuid  = om.usuario_uuid
             JOIN core.contacto c ON c.contacto_id   = u.contacto_id
             JOIN core.organizacion_rol_catalog rc ON rc.codigo = om.rol_codigo
             WHERE o.organizacion_uuid = $1
               AND om.activo = true
             ORDER BY rc.rol_id, c.apellido_paterno`,
            [organizacionUUID],
        );
        return rows.map((r: any): OrgMiembroRow => ({
            miembroId: Number(r.miembro_id),
            usuarioUuid: r.usuario_uuid,
            nombre: r.nombre,
            apellido: r.apellido,
            email: r.email,
            avatarUrl: r.avatar_url ?? null,
            rolCodigo: r.rol_codigo,
            rolNombre: r.rol_nombre,
            incorporadoEn: r.incorporado_en,
        }));
    }

    async cambiarRolMiembro(
        organizacionUUID: string,
        usuarioUuid: string,
        rolCodigo: string,
    ): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.organizacion_miembro om
             SET rol_codigo = $1
             FROM core.organizacion o
             WHERE o.organizacion_id = om.organizacion_id
               AND o.organizacion_uuid = $2
               AND om.usuario_uuid    = $3
               AND om.activo          = true`,
            [rolCodigo, organizacionUUID, usuarioUuid],
        );
        const affected = result[1] as number;
        if (affected === 0) {
            throw new NotFoundException('Miembro no encontrado en la organización.');
        }
        this.logger.log(`[cambiarRol] org=${organizacionUUID} user=${usuarioUuid} rol=${rolCodigo}`);
        return { ok: true };
    }

    async removerMiembro(organizacionUUID: string, usuarioUuid: string): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.organizacion_miembro om
             SET activo = false
             FROM core.organizacion o
             WHERE o.organizacion_id = om.organizacion_id
               AND o.organizacion_uuid = $1
               AND om.usuario_uuid    = $2
               AND om.activo          = true`,
            [organizacionUUID, usuarioUuid],
        );
        const affected = result[1] as number;
        if (affected === 0) {
            throw new NotFoundException('Miembro no encontrado o ya removido.');
        }
        this.logger.log(`[removerMiembro] org=${organizacionUUID} user=${usuarioUuid}`);
        return { ok: true };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GRUPOS DE TRABAJO
    // ─────────────────────────────────────────────────────────────────────────

    /** Resuelve el organizacion_uuid a partir del organizacion_id BIGINT */
    private async resolveOrgid(organizacionUUID: string): Promise<number> {
        const rows = await this.dataSource.query(
            `SELECT organizacion_id FROM core.organizacion WHERE organizacion_uuid = $1`,
            [organizacionUUID],
        );
        if (rows.length === 0) throw new NotFoundException('Organización no encontrada.');
        return rows[0].organizacion_id as number;
    }

    private async fetchGrupoMiembros(grupoId: string): Promise<GrupoMiembroRow[]> {
        const rows = await this.dataSource.query(
            `SELECT
               gm.miembro_id,
               gm.usuario_uuid,
               c.nombres           AS nombre,
               c.apellido_paterno  AS apellido,
               NULL                AS avatar_url,
               gm.cargo_en_grupo
             FROM core.grupo_miembro gm
             JOIN core.usuario  u ON u.usuario_uuid = gm.usuario_uuid
             JOIN core.contacto c ON c.contacto_id  = u.contacto_id
             WHERE gm.grupo_id = $1
               AND gm.active   = true`,
            [grupoId],
        );
        return rows.map((r: any): GrupoMiembroRow => ({
            miembroId: r.miembro_id,
            usuarioUuid: r.usuario_uuid,
            nombre: r.nombre,
            apellido: r.apellido,
            avatarUrl: r.avatar_url ?? null,
            cargoEnGrupo: r.cargo_en_grupo ?? null,
        }));
    }

    async listarGrupos(organizacionUUID: string): Promise<GrupoRow[]> {
        // const orgUuid = await this.resolveOrgUuid(organizacionId);

        const rows = await this.dataSource.query(
            `SELECT
               gt.grupo_id,
               gt.nombre,
               gt.descripcion,
               gt.lider_usuario_uuid AS lider_uuid,
               c.nombres             AS lider_nombre,
               c.apellido_paterno    AS lider_apellido,
               gt.activo,
               gt.created_at         AS creado_en
             FROM core.grupo_trabajo gt
             JOIN core.usuario  u ON u.usuario_uuid = gt.lider_usuario_uuid
             JOIN core.contacto c ON c.contacto_id  = u.contacto_id
             WHERE gt.organizacion_id = $1
               AND gt.activo          = true
             ORDER BY gt.nombre`,
            [organizacionUUID],
        );

        const grupos: GrupoRow[] = [];
        for (const r of rows) {
            const miembros = await this.fetchGrupoMiembros(r.grupo_id);
            grupos.push({
                grupoId: r.grupo_id,
                nombre: r.nombre,
                descripcion: r.descripcion ?? null,
                liderUuid: r.lider_uuid,
                liderNombre: r.lider_nombre,
                liderApellido: r.lider_apellido,
                activo: r.activo,
                creadoEn: r.creado_en,
                miembros,
            });
        }
        return grupos;
    }

    async crearGrupo(input: CrearGrupoInput): Promise<GrupoRow> {

        const rows = await this.dataSource.query(
            `INSERT INTO core.grupo_trabajo
               (nombre, descripcion, lider_usuario_uuid, organizacion_id, activo, grupo_metadata)
             VALUES ($1, $2, $3, $4, true, '{}')
             RETURNING grupo_id, nombre, descripcion, lider_usuario_uuid, activo, created_at`,
            [input.nombre, input.descripcion ?? null, input.liderUuid, input.organizacionUUID],
        );
        const g = rows[0];

        // Auto-insertar al líder como primer miembro
        await this.dataSource.query(
            `INSERT INTO core.grupo_miembro
               (grupo_id, usuario_uuid, cargo_en_grupo, grupo_metadata, active)
             VALUES ($1, $2, 'Lider de equipo', '{"rol":"lider"}', true)
             ON CONFLICT DO NOTHING`,
            [g.grupo_id, input.liderUuid],
        );

        const liderRows = await this.dataSource.query(
            `SELECT c.nombres, c.apellido_paterno
             FROM core.usuario u JOIN core.contacto c ON c.contacto_id = u.contacto_id
             WHERE u.usuario_uuid = $1`,
            [input.liderUuid],
        );

        const miembros = await this.fetchGrupoMiembros(g.grupo_id);
        return {
            grupoId: g.grupo_id,
            nombre: g.nombre,
            descripcion: g.descripcion ?? null,
            liderUuid: g.lider_usuario_uuid,
            liderNombre: liderRows[0]?.nombres ?? '',
            liderApellido: liderRows[0]?.apellido_paterno ?? '',
            activo: g.activo,
            creadoEn: g.created_at,
            miembros,
        };
    }

    async actualizarGrupo(grupoId: string, nombre: string, descripcion?: string): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.grupo_trabajo
             SET nombre = $1, descripcion = $2
             WHERE grupo_id = $3 AND activo = true`,
            [nombre, descripcion ?? null, grupoId],
        );
        if ((result[1] as number) === 0) throw new NotFoundException('Grupo no encontrado.');
        return { ok: true };
    }

    async eliminarGrupo(grupoId: string): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.grupo_trabajo SET activo = false WHERE grupo_id = $1 AND activo = true`,
            [grupoId],
        );
        if ((result[1] as number) === 0) throw new NotFoundException('Grupo no encontrado.');
        return { ok: true };
    }

    async agregarMiembroGrupo(
        grupoId: string,
        usuarioUuid: string,
        cargoEnGrupo?: string,
    ): Promise<{ ok: boolean }> {
        const existing = await this.dataSource.query(
            `SELECT miembro_id FROM core.grupo_miembro WHERE grupo_id = $1 AND usuario_uuid = $2`,
            [grupoId, usuarioUuid],
        );
        if (existing.length > 0) {
            // Re-activar si estaba inactivo
            await this.dataSource.query(
                `UPDATE core.grupo_miembro SET active = true, cargo_en_grupo = $1
                 WHERE grupo_id = $2 AND usuario_uuid = $3`,
                [cargoEnGrupo ?? null, grupoId, usuarioUuid],
            );
        } else {
            await this.dataSource.query(
                `INSERT INTO core.grupo_miembro
                   (grupo_id, usuario_uuid, cargo_en_grupo, grupo_metadata, active)
                 VALUES ($1, $2, $3, '{}', true)`,
                [grupoId, usuarioUuid, cargoEnGrupo ?? null],
            );
        }
        this.logger.log(`[agregarMiembro] grupo=${grupoId} user=${usuarioUuid}`);
        return { ok: true };
    }

    async removerMiembroGrupo(grupoId: string, usuarioUuid: string): Promise<{ ok: boolean }> {
        const result = await this.dataSource.query(
            `UPDATE core.grupo_miembro
             SET active = false
             WHERE grupo_id = $1 AND usuario_uuid = $2 AND active = true`,
            [grupoId, usuarioUuid],
        );
        if ((result[1] as number) === 0) throw new NotFoundException('Miembro no está en el grupo.');
        return { ok: true };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENROLAMIENTO
    // ─────────────────────────────────────────────────────────────────────────

    async generarTokenEnrolamiento(
        organizacionUUID: string,
        adminUuid: string,
        rolDestino = 'COLABORADOR',
    ): Promise<{ token: string; expiraEn: string }> {
        const organizacionID = await this.resolveOrgid(organizacionUUID);
        // Se genera una solicitud "fantasma" con uuid=admin como solicitante inicial;
        // el destinatario la reclama con el token. Para simplicidad usamos la misma tabla.
        await this.dataSource.query(`SELECT core.fn_marcar_solicitudes_expiradas()`);

        // Conflicto: si admin ya creó una solicitud pendiente para sí mismo en esta org,
        // cancelarla antes de generar una nueva (el token es para compartir).
        await this.dataSource.query(
            `UPDATE core.organizacion_solicitud_acceso
             SET estado = 'CANCELADA'
             WHERE organizacion_id = $1 AND solicitante_uuid = $2 AND estado = 'PENDIENTE'`,
            [organizacionID, adminUuid],
        );

        const rows = await this.dataSource.query(
            `INSERT INTO core.organizacion_solicitud_acceso
               (organizacion_id, solicitante_uuid, rol_solicitado, mensaje, estado)
             VALUES ($1, $2, $3, 'Código de enrolamiento generado por admin', 'PENDIENTE')
             RETURNING token, expira_en`,
            [organizacionID, adminUuid, rolDestino],
        );
        this.logger.log(`[generarToken] org=${organizacionID} admin=${adminUuid} rol=${rolDestino}`);
        return {
            token: rows[0].token as string,
            expiraEn: rows[0].expira_en as string,
        };
    }
}
