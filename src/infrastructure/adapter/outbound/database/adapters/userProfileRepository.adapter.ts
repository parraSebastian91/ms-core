import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { SystemNavigationModel } from "src/core/domain/model/systemNavigation.model";
import { UserProfileModel } from "src/core/domain/model/userProfile.model";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";
import { DataSource } from "typeorm";
import { ProfileImageQueryResponse } from "../entities/profileImage.queryResponse";
import { ProfileImageModel } from "src/core/domain/model/userProfileImage.model";
import { ImageProfileError } from "src/core/share/errors/ImageProfile.error";
import { UserOrganizacionProfileModel } from "src/core/domain/model/userOrganizacionProfile.model";
import { OrgNotFoundError } from "src/core/share/errors/OrganizacionNotFound.error";

@Injectable()
export class UserProfileRepositoryAdapter implements IUserProfileRepository {
    private readonly logger = new Logger(UserProfileRepositoryAdapter.name);
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }


    async getUserProfile(uuid: string): Promise<UserProfileModel | null> {
        const query = `SELECT
                        u.userName                  AS username,
                        u.usuario_uuid,
                        u.created_at                AS "ingreso",
                        u.activo,
                        c.nombres,
                        c.apellido_paterno,
                        c.apellido_materno,
                        c.direccion,
                        c.celular,
                        c.correo,
                        c.fecha_nacimiento,
                        c.redes_sociales,
                        c.tipo_documento,
                        c.numero_documento,
                        tc.nombre                   AS "tipo_contacto",
                       COALESCE(
                            ARRAY_AGG(r.codigo ORDER BY r.codigo )
                            FILTER (WHERE r.codigo IS NOT NULL),
                            '{}'::text[]
                        )                          AS roles
                        FROM core.usuario u
                        LEFT JOIN core.contacto c
                            ON u.contacto_id = c.contacto_id
                        LEFT JOIN core.tipo_contacto tc
                            ON c.tipo_contacto_id = tc.tipo_contacto_id
                        LEFT JOIN core.usuario_rol ur
                            ON ur.usuario_id = u.usuario_id
                        LEFT JOIN core.rol r
                            ON r.rol_id = ur.rol_id
                        WHERE u.usuario_uuid = $1
                        GROUP BY
                            u.userName, u.usuario_uuid, u.created_at, u.activo,
                            c.nombres, c.apellido_paterno, c.apellido_materno,
                            c.direccion, c.celular, c.correo, c.fecha_nacimiento,
                            c.redes_sociales, c.tipo_documento, c.numero_documento,
                            tc.nombre`;

        const result = await this.dataSource.query(query, [uuid]);

        if (!result?.length) return null;

        return UserProfileModel.fromData(result[0]);
    }

    async GetSistema(uuid: string): Promise<any> {

        const query = `SELECT
                        o.organizacion_uuid         AS organizacion_identity,
                        s.nombre                    AS nombre_sistema,
                        s.path                      AS ruta_sistema,
                        s.descripcion               AS descripcion_sistema,
                        s.icono 					as sys_icon,
                        m.nombre                    AS nombre_modulo,
                        m.path                      AS ruta_modulo,
                        m.descripcion               AS descripcion_modulo,
                        m.icono  				    AS mod_icon,
                        f.nombre                    AS nombre_funcion,
                        f.path                      AS ruta_funcion,
                        f.descripcion               AS descripcion_funcion,
                        f.icono  				    AS func_icon,
                        p.per_cod                   AS codigo_permiso,
                        p.per_nombre                AS nombre_permiso
                    FROM core.usuario u 
                        join core.organizacion_miembro om
                            on u.usuario_uuid = om.usuario_uuid 
                            and om.activo = true
                        join core.organizacion o 
                            on o.organizacion_id = om.organizacion_id 
                        JOIN core.organizacion_sistema os
                            ON os.organizacion_id = o.organizacion_id
                        JOIN core.sistema s
                            ON s.sistema_id = os.sistema_id
                            AND s.activo = true
                        JOIN core.modulo m
                            ON m.sistema_id = s.sistema_id
                            AND m.activo = true
                        LEFT JOIN core.funcionalidad f
                            ON f.modulo_id = m.modulo_id
                            AND f.activo = true
                        JOIN core.usuario_rol ur
                            ON ur.usuario_id = u.usuario_id
                        JOIN core.rol_modulo_permiso rmp
                            ON rmp.rol_id = ur.rol_id
                            AND rmp.modulo_id = m.modulo_id
                        JOIN core.permiso p
                            ON p.permiso_id = rmp.permiso_id
                            AND p.per_activo = true
                    WHERE u.usuario_uuid = $1
                    ORDER BY o.razon_social, s.nombre, m.nombre, f.nombre, p.per_cod;`;
        const result = await this.dataSource.query(query, [uuid]);
        if (!result?.length) return null;
        return SystemNavigationModel.fromDatabaseRecord(result);

    }

    async GetUserProfileImage(uuid: string): Promise<ProfileImageModel[]> {
        this.logger.log(`Fetching user profile image for UUID: ${uuid}`);
        const query = ` select 
                        m.category,
                        mv.url_path as path,
                        mv.metadata 
                        from 
                            core.usuario u left join media.media_assets m
                                on u.usuario_uuid = m.owner_id
                                and m.status = 'READY'
                                and m.m_type = 'IMAGE'
                            left join media.media_variants mv
                                on mv.asset_id = m.id
                        where 
                        u.usuario_uuid = $1`;
        const result = await this.dataSource.query<ProfileImageQueryResponse[]>(query, [uuid]);
        if (!result[0]?.metadata) {
            this.logger.warn(`No profile image found for UUID: ${uuid}`);
            throw new ImageProfileError(`No profile image found for user`);
        }
        return ProfileImageQueryResponse.toDomainModel(result);
    }

    async UpdateUserProfile(uuid: string, data: UserProfileModel): Promise<UserProfileModel> {
        this.logger.log(`Updating user profile for UUID: ${uuid}`);
        const query = `UPDATE core.contacto
                       SET nombres = $1, apellido_paterno = $2, apellido_materno = $3, direccion = $4, celular = $5, correo = $6
                       WHERE contacto_id = (SELECT contacto_id FROM core.usuario WHERE usuario_uuid = $7)
                       RETURNING *`;
        const values = [data.nombres, data.apellido_paterno, data.apellido_materno, data.direccion, data.celular, data.correo, uuid];
        const result = await this.dataSource.query<UserProfileModel[]>(query, values);
        if (!result[0]) {
            this.logger.warn(`Failed to update user profile for UUID: ${uuid}`);
            throw new Error("Failed to update user profile");
        }
        return result[0];
    }

    async getOrganizacionByUsuario(uuid: string): Promise<UserOrganizacionProfileModel[]> {
        const query = `WITH roles_priorizados AS (
                            SELECT
                                ur.usuario_id,
                                r.codigo,
                                ROW_NUMBER() OVER (
                                    PARTITION BY ur.usuario_id
                                    ORDER BY
                                        CASE r.codigo
                                            WHEN 'ADMIN_FINANCIADORA'    THEN 1
                                            WHEN 'EJECUTIVO_FINANCIADORA' THEN 2
                                            WHEN 'ADMIN_CEDENTE'          THEN 3
                                            WHEN 'CLIENTE_CEDENTE'        THEN 4
                                        END
                                ) AS rn
                            FROM core.usuario_rol ur
                            JOIN core.rol r ON r.rol_id = ur.rol_id
                            WHERE r.codigo IN (
                                'CLIENTE_CEDENTE', 'ADMIN_CEDENTE',
                                'EJECUTIVO_FINANCIADORA', 'ADMIN_FINANCIADORA'
                            )
                        )
                        SELECT
                            CONCAT(c.nombres, ' ', c.apellido_paterno, ' ', c.apellido_materno) AS nombre_contacto,
                            u.usuario_uuid,
                            u.userName,
                            orc.nombre  AS cargo,
                            o.razon_social,
                            o.organizacion_uuid,
                            o.tipo_participante,
                            o.tipo_organizacion,
                            CASE
                                WHEN o.tipo_participante = 'FINANCIADORA'
                                    AND rp.codigo IN ('EJECUTIVO_FINANCIADORA', 'ADMIN_FINANCIADORA')
                                    THEN 'PORTAL_FINANCIADORA'
                                WHEN o.tipo_participante = 'CEDENTE'
                                    AND rp.codigo IN ('CLIENTE_CEDENTE', 'ADMIN_CEDENTE')
                                    THEN 'PORTAL_CEDENTE'
                                ELSE 'SIN_ACCESO'
                            END AS portal
                        FROM core.usuario u
                        JOIN core.contacto c
                            ON u.contacto_id = c.contacto_id
                        JOIN core.organizacion_miembro om
                            ON u.usuario_uuid = om.usuario_uuid
                        JOIN core.organizacion_rol_catalog orc
                            ON orc.codigo = om.rol_codigo
                        JOIN core.organizacion o
                            ON om.organizacion_id = o.organizacion_id
                            AND o.activo = true
                        JOIN roles_priorizados rp
                            ON rp.usuario_id = u.usuario_id
                            AND rp.rn = 1          -- solo el rol de mayor jerarquía
                        WHERE u.usuario_uuid = $1
                            AND u.activo = true
                            AND o.activo = true;`;
        const values = [uuid];
        const result = await this.dataSource.query<UserOrganizacionProfileModel[]>(query, values);
        if (!result[0]) {
            this.logger.warn(`No se encontró una organización activa asociada al usuario o el usuario no tiene roles asignados en la organización para UUID: ${uuid}`);
            throw new OrgNotFoundError("No se encontró una organización activa asociada al usuario o el usuario no tiene roles asignados en la organización.");
        }
        return result;
    }

    async getUserProfileByUsername(usuario: string, organizacion_uuid: string): Promise<{ profile: { userName: string, usuario_uuid: string, organizacion_uuid: string } | null, isValid: boolean }> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario);
        const query = ` SELECT
                            u.userName,
                            u.usuario_uuid,
                            o.organizacion_uuid
                        from 
                            core.usuario u join core.grupo_miembro gm
                                on gm.usuario_uuid = u.usuario_uuid and gm.active = true
                            join core.grupo_trabajo gt
                                on gm.grupo_id = gt.grupo_id and gt.activo = true
                            join core.organizacion o
                                on gt.organizacion_id = o.organizacion_uuid and o.activo = true
                        where 
                        ${isUUID ? 'u.usuario_uuid' : 'u.userName'} = $1
                        and o.organizacion_uuid = $2`;
        const values = [usuario, organizacion_uuid];
        try {
            const result = await this.dataSource.query(query, values);
            this.logger.debug(`Resultado de la verificación de usuario y organización: ${JSON.stringify(result)}`);
            return { profile: result[0], isValid: !!result[0] };
        } catch (error: any) {
            this.logger.error(
                `Error al verificar si el usuario pertenece a la organización: ${error?.message ?? error}`,
                `usuario: ${usuario}, organización: ${organizacion_uuid}`,
                error?.stack,
            );
            return { profile: null, isValid: false };
        }
    }

    async validateUserAndOrganizacion(usuario: string, organizacion_uuid: string): Promise<boolean> {
        const isValid = await this.getUserProfileByUsername(usuario, organizacion_uuid);
        if (!isValid.isValid) {
            return false;
        }

        return isValid.isValid;
    }
}