import { FacturaModel } from "../../model/factura.model";

export interface IFacturaManager {
    ExecutePublishFactura(factura: FacturaModel): Promise<boolean>;
}