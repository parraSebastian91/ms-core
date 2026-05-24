import { OrganizacionModel } from "../../model/organizacion.model";

export interface IOrganizacionRepository {
    getOrganizacionByUUID(uuid: string): Promise<OrganizacionModel | null>;
    getOrganizacionByRazonSocial(razonSocial: string): Promise<OrganizacionModel | null>;
    getOrganizacionesByUserUUID(userUUID: string): Promise<OrganizacionModel[]>;
    getOrganizacionesByTipoParticipante(tipoParticipante: string): Promise<OrganizacionModel[]>;
    createOrganizacion(organizacion: OrganizacionModel): Promise<OrganizacionModel>;
    updateOrganizacion(organizacion: OrganizacionModel): Promise<OrganizacionModel>;
    deleteOrganizacion(uuid: string): Promise<void>;
}