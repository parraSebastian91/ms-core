import { FacturaModel } from "../../model/factura.model";

export interface IFacturaService {
    GrantAccess_OrganizationByTipoParticipante(
        tipoRecurso: string,
        TipoParticipante: string,
        resourceId: string,
        userGrante: string,
        permissions: string[],
        razon_descripcion: string
    ): Promise<number>;

     compararDatosOCRConFactura(factura: FacturaModel): Promise<boolean>;

    // PublicarFactura(factura: FacturaModel): Promise<{ success: boolean; message: string }>;
}