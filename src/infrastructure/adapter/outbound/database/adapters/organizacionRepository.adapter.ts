import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { error } from "console";
import { OrganizacionModel } from "src/core/domain/model/organizacion.model";
import {
    CrearOrganizacionInput,
    IOrganizacionRepository,
    OrganizacionCreada,
} from "src/core/domain/puertos/outbound/IOrganizacion.repository";
import { DataSource } from "typeorm";

export class organizacionRepositoriAdapter implements IOrganizacionRepository {

    private readonly logger = new Logger(organizacionRepositoriAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    getOrganizacionByRazonSocial(razonSocial: string): Promise<OrganizacionModel | null> {
        throw new Error("Method not implemented.");
    }

    getOrganizacionesByUserUUID(userUUID: string): Promise<OrganizacionModel[]> {
        throw new Error("Method not implemented.");
    }

    async getOrganizacionesByTipoParticipante(tipoParticipante: string): Promise<OrganizacionModel[]> {
        const query = `
        select
            o.organizacion_uuid,
            o.razon_social,
            o.tipo_organizacion,
            concat(o.rut,'-',o.dv) as formato_rut,
            o.rut,
            o.dv as rut_dv,
            o.tipo_participante
        from core.organizacion o
        where o.tipo_participante = $1 and o.activo = true`;

        try {
            const result = await this.dataSource.query(query, [tipoParticipante]);
            return OrganizacionModel.fromQuery(result);
        } catch (error: any) {
            this.logger.error(
                `Error al obtener organizaciones por tipo: ${error?.message ?? error}`,
                `tipo: ${tipoParticipante}`,
                error?.stack,
            );
            return [];
        }
    }

    async createOrganizacion(input: OrganizacionModel): Promise<OrganizacionModel> {

        // ON CONFLICT (rut, dv) -> actualiza updated_at y retorna el registro (idempotente)
        try {
            const rows = await this.dataSource.query(
                `INSERT INTO core.organizacion
               (razon_social, tipo_organizacion, rut, dv, giro, tipo_participante)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (rut, dv) DO UPDATE
               SET updated_at = now()
             RETURNING
               organizacion_id AS id,
               organizacion_uuid AS uuid,
               razon_social,
               tipo_organizacion,
               tipo_participante,
               rut,
               dv`,
                [
                    input.razonSocial,
                    input.tipoOrganizacion,
                    input.rut,
                    input.rutDv,
                    input.getGiroPrincipal(),
                    input.tipoParticipante,
                ],
            );

            const row = rows[0];
            this.logger.log(`[createOrganizacion] id=${row.id} uuid=${row.uuid} rut=${input.rut}-${input.rutDv}`);
            return OrganizacionModel.build()
                .setOrganizacionId(row.id)
                .setOrganizacionUuid(row.uuid)
                .setRazonSocial(row.razon_social)
                .setTipoOrganizacion(row.tipo_organizacion)
                .setTipoParticipante(row.tipo_participante)
                .setRut(row.rut)
                .setRutDv(row.dv)
                .build();
        } catch (error: any) {
            this.logger.error(
                `Error al crear organización: ${error?.message ?? error}`,
                `input: ${JSON.stringify(input)}`,
                error?.stack,
            );
            return undefined as any;
        }

    }

    async checkRut(rut: string): Promise<{ exists: boolean; organizacion?: { id: string; razonSocial: string; tipoPersona: string; tipoParticipante: string; giros: object[] } }> {
        if (!rut || rut.length < 2) {
            return { exists: false };
        }
        const dv = rut.slice(-1).toUpperCase();
        const rutNum = rut.slice(0, -1);
        const rows = await this.dataSource.query(
                `SELECT
                    o.organizacion_uuid,
                    o.razon_social,
                    o.tipo_organizacion,
                    o.tipo_participante,
                    COALESCE(
                    json_agg(
                        json_build_object(
                        'codigo',              ae.codigo,
                        'descripcion',         ce.descripcion,
                        'categoriaTributaria', ce.categoria_tributaria::text,
                        'fechaInicio',         to_char(ae.fecha_inicio, 'DD-MM-YYYY'),
                        'indicadorAfectoIva',  CASE WHEN ce.afecto_iva THEN 'S' ELSE 'N' END
                        ) ORDER BY ae.es_principal DESC, ae.id
                    ) FILTER (WHERE ae.id IS NOT NULL),
                    '[]'
                        ) AS giros
                    FROM core.organizacion o
                    LEFT JOIN core.actividad_organizacion ae
                        ON ae.organizacion_uuid = o.organizacion_uuid AND ae.activo = true
                    join core.categoria_economica ce
                        on ce.codigo = ae.codigo and ce.fuente = ae.fuente
                  WHERE o.rut = $1 AND o.dv = $2 AND o.activo = true
                    GROUP BY o.organizacion_uuid, o.razon_social, o.tipo_organizacion, o.tipo_participante
                LIMIT 1`,
            [rutNum, dv],
        );
        if (rows.length === 0) {
            return { exists: false };
        }
        const org = rows[0];
        return {
            exists: true,
            organizacion: {
                id: org.organizacion_uuid,
                razonSocial: org.razon_social,
                tipoPersona: org.tipo_organizacion,
                tipoParticipante: org.tipo_participante,
                giros: org.giros,
            },
        };
    }

    updateOrganizacion(organizacion: OrganizacionModel): Promise<OrganizacionModel> {
        throw new Error("Method not implemented.");
    }

    deleteOrganizacion(uuid: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getOrganizacionByUUID(uuid: string): Promise<OrganizacionModel | null> {
        throw new Error("Method not implemented.");
    }
}
