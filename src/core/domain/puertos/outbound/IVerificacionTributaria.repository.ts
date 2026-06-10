import { GiroComercialModel } from "../../model/organizacion.model";
import { TributaryModel } from "../../model/tributaryData.model";

export const VERIFICACION_TRIBUTARIA_REPOSITORY = 'VERIFICACION_TRIBUTARIA_REPOSITORY';

export interface GuardarVerificacionPayload {
    organizacionId: number;
    rawResponse: Record<string, any>;
    fuente: string;   // 'SII' | 'AFIP' | 'SAT' | ...
}

export interface IVerificacionTributariaRepository {
    insertTributaryData(normalized: TributaryModel, organizacionId: number, fuente: string): Promise<{ id: number }>;
    insertActividadEconomica(organizacionId: number, actividad: GiroComercialModel): Promise<void>;
    deleteActividadesEconomicas(organizacionId: number, fuente: string): Promise<void>;
    getVerificacionVigente(organizacionId: number): Promise<Record<string, any> | null>;
    upsertRaw(payload: GuardarVerificacionPayload): Promise<void>;
}
