import { MessageDTO } from "src/infrastructure/adapter/outbound/queue/dto/Notificacion.dto";
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
    RevokeAccess_OrganizationByTipoParticipante(
        tipoRecurso: string,
        TipoParticipante: string,
        resourceId: string,
        permissions: string[],
    ): Promise<number>;
    compararDatosOCRConFactura(facturaOCR: FacturaModel, facturaAlmacenada: FacturaModel): Promise<NotaOCR[]>;
    guardarNotasOCR(factura: FacturaModel, facturaAlmacenada: FacturaModel): Promise<MessageDTO>;
    // PublicarFactura(factura: FacturaModel): Promise<{ success: boolean; message: string }>;
}