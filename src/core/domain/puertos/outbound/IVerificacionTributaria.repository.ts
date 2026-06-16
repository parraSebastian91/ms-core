import { GiroComercialModel } from "../../model/organizacion.model";
import { TributaryModel } from "../../model/tributaryData.model";

export interface GuardarVerificacionPayload {
    organizacionId: number;
    rawResponse: Record<string, any>;
    fuente: string;   // 'SII' | 'AFIP' | 'SAT' | ...
}

export interface IVerificacionTributariaRepository {
    insertTributaryData(normalized: TributaryModel, organizacionId: number, fuente: string): Promise<{ id: number }>;
    insertActividadEconomica(actividad: GiroComercialModel): Promise<void>;
    soncronizarActividadesEconomicas(organizacionuuID: string, fuente: string, actividades: GiroComercialModel[]): Promise<void>;
    deleteActividadesEconomicas(organizacionId: number, fuente: string): Promise<void>;
    getVerificacionVigente(organizacionId: number): Promise<Record<string, any> | null>;
    upsertRaw(payload: GuardarVerificacionPayload): Promise<void>;
}
