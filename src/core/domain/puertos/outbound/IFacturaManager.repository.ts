import { FacturaModel } from "../../model/factura.model";

export interface IFacturaManager {
    publishFactura(factura: FacturaModel): Promise<void>;
}