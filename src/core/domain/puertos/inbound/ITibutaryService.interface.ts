import { GiroComercialModel } from "../../model/organizacion.model";

export interface ITributaryService {
    // Aquí puedes definir los métodos que el servicio tributario debe implementar
    // Por ejemplo:
    // verificarTributaria(identificadorFiscal: string): Promise<TributaryModel>;
    SincronizarDatosTributarios(organizacionId: number, fuente: string, giro: GiroComercialModel[]): Promise<void>;
}