import { FacturaModel } from "src/core/domain/model/factura.model";
import { IFacturaManager } from "src/core/domain/puertos/inbound/IFacturaPublisher.interface";

export class FacturaManagerUseCase implements IFacturaManager {

    async ExecutePublishFactura(factura: FacturaModel): Promise<void> {
        // Lógica para publicar la factura
        console.log("Factura publicada:", factura);
    }

}