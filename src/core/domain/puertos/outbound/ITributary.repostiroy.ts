import { GiroComercialModel } from "../../model/organizacion.model";

export interface ITributaryRepository {
    insertGiroComercial(giro: GiroComercialModel): Promise<Record<string, any> | null>;
}