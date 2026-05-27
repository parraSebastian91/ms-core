import { FacturaModel } from "../../model/factura.model";
import { FacturaUpdateModel } from "../../model/facturaUpdate.model";

export interface VersionTerminosRecord {
    id: string;
    codigo: string;
    descripcion: string;
    texto_completo: string;
    hash_sha256: string;
}

export interface AutorizacionPublicacionPayload {
    facturaId: string;
    versionTerminosId: string;
    acepto: boolean;
    usuarioUUID: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
}

export interface IFacturaManager {
    ExecutePublishFactura(factura: FacturaModel): Promise<boolean>;
    ExecuteCargaDocumentoRespaldo(factura: FacturaModel): Promise<boolean>;
    ExecutePublicarFormFactura(factura: FacturaModel): Promise<FacturaModel>;
    ExecuteGetFacturas(usuario: string, orgUUID: string): Promise<FacturaModel[]>;
    ExecuteUpdateFactura(factura: FacturaUpdateModel): Promise<{ campo: string, id: string, valor: any, isUpdate: any, mensaje: string } | null>;
    ExecuteGetUrlFacturas(facturaID: string[], correlationId: string): Promise<{ id: string, keyUrl: string }[]>;
    ExecuteGetVersionTerminosActiva(): Promise<VersionTerminosRecord>;
    ExecuteRegistrarAutorizacion(payload: AutorizacionPublicacionPayload): Promise<void>;
}