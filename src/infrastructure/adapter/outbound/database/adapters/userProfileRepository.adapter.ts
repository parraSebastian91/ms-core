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
                        u.nombres,
                        u.apellido_paterno,
                        u.apellido_materno,
                        u.direccion,
                        u.celular,
                        u.correo,
                        u.fecha_nacimiento,
                        u.redes_sociales,
                        u.tipo_documento,
                        u.numero_documento,
                        u.tipo_contacto             AS "tipo_contacto",
                       COALESCE(
                            ARRAY_AGG(r.rol_codigo ORDER BY r.rol_codigo )
                            FILTER (WHERE r.rol_codigo IS NOT NULL),
                            '{}'::text[]
                        )                          AS roles
                        FROM identity_api.v_usuario_perfil u
                        LEFT JOIN identity_api.v_usuario_rol r
                            ON r.usuario_uuid = u.usuario_uuid
                        WHERE u.usuario_uuid = $1
                        GROUP BY
                            u.username, u.usuario_uuid, u.created_at, u.activo,
                            u.nombres, u.apellido_paterno, u.apellido_materno,
                            u.direccion, u.celular, u.correo, u.fecha_nacimiento,
                            u.redes_sociales, u.tipo_documento, u.numero_documento,
                            u.tipo_contacto`;

        const result = await this.dataSource.query(query, [uuid]);

        if (!result?.length) return null;

        return UserProfileModel.fromData(result[0]);
    }

    async GetSistema(uuid: string): Promise<any> {

        // Navegación y permisos efectivos vienen del contrato identity_api; los sistemas contratados, del dominio core.
        const query = `SELECT
                        o.organizacion_uuid         AS organizacion_identity,
                        n.sistema_nombre            AS nombre_sistema,
                        n.sistema_path              AS ruta_sistema,
                        n.sistema_descripcion       AS descripcion_sistema,
                        n.sistema_icono             AS sys_icon,
                        n.modulo_nombre             AS nombre_modulo,
                        n.modulo_path               AS ruta_modulo,
                        n.modulo_descripcion        AS descripcion_modulo,
                        n.modulo_icono              AS mod_icon,
                        n.funcion_nombre            AS nombre_funcion,
                        n.funcion_path              AS ruta_funcion,
                        n.funcion_descripcion       AS descripcion_funcion,
                        n.funcion_icono             AS func_icon,
                        n.permiso_codigo            AS codigo_permiso,
                        n.permiso_nombre            AS nombre_permiso
                    FROM core.organizacion_miembro om
                        join core.organizacion o
                            on o.organizacion_id = om.organizacion_id
                        JOIN core.organizacion_sistema os
                            ON os.organizacion_id = o.organizacion_id
                        JOIN identity_api.v_usuario_navegacion n
                            ON n.usuario_uuid = om.usuario_uuid
                            AND n.sistema_id = os.sistema_id
                    WHERE om.usuario_uuid = $1
                        AND om.activo = true
                    ORDER BY o.razon_social, n.sistema_nombre, n.modulo_nombre, n.funcion_nombre, n.permiso_codigo;`;
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
                            media.media_assets m
                            join media.media_variants mv
                                on mv.asset_id = m.id
                        where
                            m.owner_id = $1
                            and m.status = 'READY'
                            and m.m_type = 'IMAGE'`;
        const result = await this.dataSource.query<ProfileImageQueryResponse[]>(query, [uuid]);
        if (!result[0]?.metadata) {
            this.logger.warn(`No profile image found for UUID: ${uuid}`);
            throw new ImageProfileError(`No profile image found for user`);
        }
        return ProfileImageQueryResponse.toDomainModel(result);
    }

    /**
     * El contacto lo gobierna ms-identity: la escritura va por su API (con el token del propio usuario,
     * que ms-identity valida) y no por SQL contra el esquema identity.
     */
    async UpdateUserProfile(uuid: string, data: UserProfileModel, accessToken: string): Promise<UserProfileModel> {
        this.logger.log(`Updating user profile for UUID: ${uuid}`);
        const base = (process.env.IDENTITY_SERVICE_BASE_URL || 'http://identity-service:3000').replace(/\/$/, '');
        const res = await fetch(`${base}/usuario/profile/${encodeURIComponent(uuid)}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
                nombre: { nombres: data.nombres, apellidoPaterno: data.apellido_paterno, apellidoMaterno: data.apellido_materno },
                datosContacto: { correo: data.correo, telefono: data.celular, ubicacion: data.direccion },
            }),
        });
        if (!res.ok) {
            this.logger.warn(`ms-identity rechazó la actualización de perfil (HTTP ${res.status}) para UUID: ${uuid}`);
            throw new Error("Failed to update user profile");
        }
        const payload: any = await res.json();
        return payload?.data as UserProfileModel;
    }

    async getOrganizacionByUsuario(uuid: string): Promise<UserOrganizacionProfileModel[]> {
        const query = `WITH roles_priorizados AS (
                            SELECT
                                ur.usuario_uuid,
                                ur.rol_codigo AS codigo,
                                ROW_NUMBER() OVER (
                                    PARTITION BY ur.usuario_uuid
                                    ORDER BY
                                        CASE ur.rol_codigo
                                            WHEN 'ADMIN_FINANCIADORA'    THEN 1
                                            WHEN 'EJECUTIVO_FINANCIADORA' THEN 2
                                            WHEN 'ADMIN_CEDENTE'          THEN 3
                                            WHEN 'CLIENTE_CEDENTE'        THEN 4
                                        END
                                ) AS rn
                            FROM identity_api.v_usuario_rol ur
                            WHERE ur.rol_codigo IN (
                                'CLIENTE_CEDENTE', 'ADMIN_CEDENTE',
                                'EJECUTIVO_FINANCIADORA', 'ADMIN_FINANCIADORA'
                            )
                        )
                        SELECT
                            CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre_contacto,
                            u.usuario_uuid,
                            u.username,
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
                        FROM identity_api.v_usuario u
                        JOIN core.organizacion_miembro om
                            ON u.usuario_uuid = om.usuario_uuid
                        JOIN core.organizacion_rol_catalog orc
                            ON orc.codigo = om.rol_codigo
                        JOIN core.organizacion o
                            ON om.organizacion_id = o.organizacion_id
                            AND o.activo = true
                        JOIN roles_priorizados rp
                            ON rp.usuario_uuid = u.usuario_uuid
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
                            u.username,
                            u.usuario_uuid,
                            o.organizacion_uuid
                        from
                            identity_api.v_usuario u join 
                            core.organizacion_miembro om 
                                on u.usuario_uuid = om.usuario_uuid 
                            join core.organizacion o
                                on o.organizacion_id = om.organizacion_id  and o.activo = true
                        where 
                        ${isUUID ? 'u.usuario_uuid' : 'u.username'} = $1
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