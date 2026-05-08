import { FacturaModel } from "../../model/factura.model";

export interface IFacturaManager {
    ExecutePublishFactura(factura: FacturaModel): Promise<boolean>;
    getFacturas(usuario: string, orgUUID: string): Promise<FacturaModel[]>;
}