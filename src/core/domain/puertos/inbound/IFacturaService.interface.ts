import { FacturaModel, NotaOCR } from "../../model/factura.model";

export interface IFacturaService {
    GrantAccess_OrganizationByTipoParticipante(
        tipoRecurso: string,
        TipoParticipante: string,
        resourceId: string,
        userGrante: string,
        permissions: string[],
        razon_descripcion: string
    ): Promise<number>;

    compararDatosOCRConFactura(facturaOCR: FacturaModel, facturaAlmacenada: FacturaModel): Promise<NotaOCR[]>;

    // PublicarFactura(factura: FacturaModel): Promise<{ success: boolean; message: string }>;
}