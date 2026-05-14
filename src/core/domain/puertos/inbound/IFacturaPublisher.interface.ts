import { FacturaModel } from "../../model/factura.model";
import { FacturaUpdateModel } from "../../model/facturaUpdate.model";

export interface IFacturaManager {
    ExecutePublishFactura(factura: FacturaModel): Promise<boolean>;
    ExecuteGetFacturas(usuario: string, orgUUID: string): Promise<FacturaModel[]>;
    ExecuteUpdateFactura(factura: FacturaUpdateModel): Promise<{ campo: string, id: string, valor: any, isUpdate: any, mensaje: string } | null>;
}