import { FacturaModel } from "../../model/factura.model";

export interface IFacturaManagerRepository {
    publishFactura(factura: FacturaModel): Promise<string>;
}