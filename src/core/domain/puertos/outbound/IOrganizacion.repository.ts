import { OrganizacionModel } from "../../model/organizacion.model";

export const ORGANIZACION_REPOSITORY = 'ORGANIZACION_REPOSITORY';

export interface CrearOrganizacionInput {
    tipoPersona: string;        // JURIDICA | PERSONA_NATURAL
    tipoParticipacion: string;  // CEDENTE | FINANCIADORA | BROKER
    rut: string;                // formato libre: "17.841.445-3" o "17841445-3"
    razonSocial: string;
    giro?: string;
}

export interface OrganizacionCreada {
    id: number;
    uuid: string;
    razonSocial: string;
    tipoPersona: string;
    tipoParticipacion: string;
    rut: string;
    dv: string;
}

export interface IOrganizacionRepository {
    getOrganizacionByUUID(uuid: string): Promise<OrganizacionModel | null>;
    getOrganizacionByRazonSocial(razonSocial: string): Promise<OrganizacionModel | null>;
    getOrganizacionesByUserUUID(userUUID: string): Promise<OrganizacionModel[]>;
    getOrganizacionesByTipoParticipante(tipoParticipante: string): Promise<OrganizacionModel[]>;
    createOrganizacion(input: OrganizacionModel): Promise<OrganizacionModel>;
    updateOrganizacion(organizacion: OrganizacionModel): Promise<OrganizacionModel>;
    deleteOrganizacion(uuid: string): Promise<void>;
    checkRut(rut: string): Promise<{ exists: boolean; organizacion?: { id: string; razonSocial: string; tipoPersona: string; tipoParticipante: string; giros: object[] } }>;
}