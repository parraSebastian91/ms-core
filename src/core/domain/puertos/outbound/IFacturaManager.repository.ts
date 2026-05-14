import { FacturaModel } from "../../model/factura.model";
import { FacturaUpdateModel } from "../../model/facturaUpdate.model";

export interface IFacturaManagerRepository {
    publishFactura(factura: FacturaModel): Promise<string>;
    getFacturas(usuario: string, orgUUID: string, isLeader: boolean): Promise<FacturaModel[]>;
    getFacturaByID(facturaID: string): Promise<FacturaModel | null>;
    validateFacturaEditable(facturaID: string): Promise<boolean>;
    updateFactura(factura: FacturaUpdateModel): Promise<{ id: string, valor: any, isUpdate: any, mensaje: string } | null>;
}