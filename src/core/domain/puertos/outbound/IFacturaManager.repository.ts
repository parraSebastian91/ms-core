import { facturaEstado } from "../../model/constantes.model";
import { FacturaModel, NotaOCR } from "../../model/factura.model";
import { FacturaUpdateModel } from "../../model/facturaUpdate.model";
import { AutorizacionPublicacionPayload, VersionTerminosRecord } from "../inbound/IFacturaPublisher.interface";

export interface IFacturaManagerRepository {
    /**
     * 
     * @param factura 
     * @returns Id del recurso inserrtado en Base de datos
     */
    publishFactura(factura: FacturaModel): Promise<string>;
    getFacturas(usuario: string, orgUUID: string, isLeader: boolean): Promise<FacturaModel[]>;
    getFacturaByID(facturaID: string): Promise<FacturaModel | null>;
    validateFacturaEditable(facturaID: string): Promise<boolean>;
    updateFactura(factura: FacturaUpdateModel): Promise<{ id: string, valor: any, isUpdate: any, mensaje: string } | null>;
    facturaExiste(facturaId: string, facturaNumero: string, owner: string): Promise<boolean>;
    updateFacturaState(factura: FacturaModel, status: facturaEstado): Promise<{ id: string, valor: any, isUpdate: any, mensaje: string }>;
    getFacturaKey(facturaID: string[]): Promise<{ id: string, keyUrl: string }[]>;
    getVersionTerminosActiva(): Promise<VersionTerminosRecord>;
    registrarAutorizacion(payload: AutorizacionPublicacionPayload): Promise<void>;
    guardarNotasOCR(facturaId: string, notas: NotaOCR[]): Promise<void>;
    updateNotasOCRResueltas(facturaId: string, campo: string): Promise<void>;
    fetchNotasForFacturas(facturaIds: string[]): Promise<Map<string, string[]>>;
}