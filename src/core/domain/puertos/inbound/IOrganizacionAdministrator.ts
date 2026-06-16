
import { GiroComercialModel, OrganizacionModel } from "../../model/organizacion.model";
import { GuardarVerificacionPayload } from "../outbound/IVerificacionTributaria.repository";

export interface IOrganizacionAdministrator {
    createOrganizacion(newOrganizacion: OrganizacionModel, usuario: any): Promise<{
        id: string;
        razonSocial: string;
        tipoOrganizacion: string;
        tipoParticipante: string;
        giros: GiroComercialModel[];
    }>;
    checkRut(rut: string): Promise<{ exists: boolean; organizacion?: { id: string; razonSocial: string; tipoPersona: string; tipoParticipante: string; giros: object[] } }>;
    getVerificacionTributaria(organizacionId: number): Promise<Record<string, any> | null>;
    guardarVerificacion(payload: GuardarVerificacionPayload): Promise<void>;
}