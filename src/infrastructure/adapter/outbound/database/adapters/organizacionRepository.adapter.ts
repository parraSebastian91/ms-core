import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { OrganizacionModel } from "src/core/domain/model/organizacion.model";
import { IOrganizacionRepository } from "src/core/domain/puertos/outbound/IOrganizacion.repository";
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
            concat(o.rut,'-',o.dv ) as formato_rut,
            o.rut,
            o.dv as rut_dv,
            o.tipo_participante 
        from core.organizacion o 
        where 
        o.tipo_participante = $1 and o.activo = true`;

        try {
            const result = await this.dataSource.query(query, [tipoParticipante]);
            return OrganizacionModel.fromQuery(result);
        } catch (error: any) {
            this.logger.error(
                `Error al obtener equipos de trabajo por tipo de organización: ${error?.message ?? error}`,
                `tipo de organización: ${tipoParticipante}`,
                error?.stack,
            );
            return [];
        }

    }
    createOrganizacion(organizacion: OrganizacionModel): Promise<OrganizacionModel> {
        throw new Error("Method not implemented.");
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