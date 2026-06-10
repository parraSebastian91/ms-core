
import { OrganizacionModel } from "../../model/organizacion.model";
import { GuardarVerificacionPayload } from "../outbound/IVerificacionTributaria.repository";

export const ORGANIZACION_USECASE = 'ORGANIZACION_USECASE';

export interface IOrganizacionAdministrator {
    createOrganizacion(newOrganizacion: OrganizacionModel): Promise<string>;
    checkRut(rut: string): Promise<{ exists: boolean; organizacion?: { id: string; razonSocial: string; tipoPersona: string; tipoParticipante: string; giros: object[] } }>;
    getVerificacionTributaria(organizacionId: number): Promise<Record<string, any> | null>;
    guardarVerificacion(payload: GuardarVerificacionPayload): Promise<void>;
}