import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { length } from "class-validator";
import { facturaEstado } from "src/core/domain/model/constantes.model";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { IFacturaManager } from "src/core/domain/puertos/inbound/IFacturaPublisher.interface";
import { IMessagePublisher } from "src/core/domain/puertos/inbound/message.publisher.interface";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";

export class FacturaManagerUseCase implements IFacturaManager {
    private readonly logger = new Logger(FacturaManagerUseCase.name);

    constructor(
        private readonly facturaRepository: IFacturaManagerRepository,
        private readonly messagePublisher: IMessagePublisher,
        private configService: ConfigService
    ) { }

    async ExecutePublishFactura(factura: FacturaModel): Promise<boolean> {
        this.logger.log(`Ejecutando publicación de factura, correlación: ${factura.correlationId}}`);

        let result = await this.facturaRepository.publishFactura(factura);

        if (result) {
            this.logger.log(`Factura publicada exitosamente para correlación: ${factura.correlationId}`);
            this.messagePublisher.publish(
                this.configService.get<string>('rabbitmq.storage_notifications_exchange'),
                this.configService.get<string>('rabbitmq.notifyRoutingKey'),
                factura,
                { persistent: true }
            );
        } else {
            const Emptyfactura = new FacturaModel(factura.ownerUUID, facturaEstado.PENDIENTE_VALIDACION, factura.correlationId);
            this.logger.error(`Error al publicar la factura: ${factura.facturaNumero}`);
            result = await this.facturaRepository.publishFactura(Emptyfactura);
            if (result) {
                this.logger.log(`Factura publicada parrar Notificaciones exitosamente para correlación: ${factura.correlationId}`);
                this.messagePublisher.publish(
                    this.configService.get<string>('rabbitmq.storage_notifications_exchange'),
                    this.configService.get<string>('rabbitmq.notifyRoutingKey'),
                    factura,
                    { persistent: true }
                );
            } else {
                this.logger.error(`Error al publicar la factura vacía para correlación: ${factura.correlationId}`);
                // enviar notificación de error o tomar acción adicional según sea necesario
            }
        }
        return result;
    }

}