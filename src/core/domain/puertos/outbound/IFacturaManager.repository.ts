import { FacturaModel } from "../../model/factura.model";

export interface IFacturaManagerRepository {
    publishFactura(factura: FacturaModel): Promise<string>;
    getFacturas(usuario: string, orgUUID: string, isLeader: boolean): Promise<FacturaModel[]>;
}