import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { length } from "class-validator";
import { CATEGORY_PROCESS, EVENT_CODES, EVENT_DESCRIPTIONS, facturaEstado } from "src/core/domain/model/constantes.model";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { IFacturaManager } from "src/core/domain/puertos/inbound/IFacturaPublisher.interface";
import { IMessagePublisher } from "src/core/domain/puertos/inbound/message.publisher.interface";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { FacturaDTO } from "src/infrastructure/adapter/outbound/queue/dto/factura.dto";
import { MessageDTO, NotificacionDTO } from "src/infrastructure/adapter/outbound/queue/dto/Notificacion.dto";

export class FacturaManagerUseCase implements IFacturaManager {
    private readonly logger = new Logger(FacturaManagerUseCase.name);

    constructor(
        private readonly facturaRepository: IFacturaManagerRepository,
        private readonly messagePublisher: IMessagePublisher,
        private configService: ConfigService
    ) { }

    async ExecutePublishFactura(factura: FacturaModel): Promise<boolean> {
        this.logger.log(`Ejecutando publicación de factura, correlación: ${factura.correlationId}}`);

        //subo la factura al repositorio de bse de datos
        const resultQuery = await this.facturaRepository.publishFactura(factura);
        const header: Record<string, unknown> = {
            correlationId: factura.correlationId,
        }

        if (resultQuery.includes("unique_factura_emisor_folio")) {
            const facturaDTO = new FacturaDTO();

            const mensaje = new MessageDTO(EVENT_CODES.FACTURA_DUPLICADA, EVENT_DESCRIPTIONS.FACTURA_DUPLICADA, true);

            const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
                CATEGORY_PROCESS.DTE_FACTURA,
                factura.ownerUUID,
                factura.gestor,
                factura.correlationId,
                mensaje,
                facturaDTO
            );
            this.messagePublisher.publish(
                this.configService.get<string>('rabbitmq.exchange'),
                this.configService.get<string>('rabbitmq.routingKeyFail'),
                notificacionBody,
                { persistent: true, headers: header }
            );
        } else if (resultQuery.includes("error")) {
            const Emptyfactura = new FacturaModel(factura.ownerUUID, factura.gestor, facturaEstado.PENDIENTE_VALIDACION, factura.correlationId);
            this.logger.warn(`Error al publicar la factura: ${factura.facturaNumero}`);
            const result = await this.facturaRepository.publishFactura(Emptyfactura);
            if (result) {
                this.logger.log(`Factura vacia publicada parar Notificaciones exitosamente para correlación: ${factura.correlationId}`);
                const facturaDTO: FacturaDTO = {
                    assetId: Emptyfactura.assetId,
                    facturaUUID: result,
                    deudorNombre: Emptyfactura.deudorNombre,
                    deudorRut: Emptyfactura.deudorRut,
                    facturaNumero: Emptyfactura.facturaNumero,
                    montoTotal: Emptyfactura.montoTotal,
                    fechaVencimiento: Emptyfactura.fechaVencimiento,
                    status: Emptyfactura.status,
                }

                const mensaje = new MessageDTO(EVENT_CODES.FACTURA_VACIA_PUBLICADA, EVENT_DESCRIPTIONS.FACTURA_VACIA_PUBLICADA, true);

                const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
                    CATEGORY_PROCESS.DTE_FACTURA,
                    factura.ownerUUID,
                    factura.gestor,
                    factura.correlationId,
                    mensaje,
                    facturaDTO
                );
                header['error'] = "factura_vacia";
                this.messagePublisher.publish(
                    this.configService.get<string>('rabbitmq.exchange'),
                    this.configService.get<string>('rabbitmq.routingKeyFail'),
                    notificacionBody,
                    { persistent: true, headers: header }
                );
            } else {
                this.logger.error(`Error al publicar la factura vacía para correlación: ${factura.correlationId}`);
                const facturaDTO = new FacturaDTO();

                const mensaje = new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, true);

                const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
                    CATEGORY_PROCESS.DTE_FACTURA,
                    factura.ownerUUID,
                    factura.gestor, 
                    factura.correlationId,
                    mensaje,
                    facturaDTO
                );
                this.messagePublisher.publish(
                    this.configService.get<string>('rabbitmq.exchange'),
                    this.configService.get<string>('rabbitmq.routingKeyFail'),
                    notificacionBody,
                    { persistent: true, headers: header }
                );
            }
        }
        this.logger.log(`Factura publicada exitosamente para correlación: ${factura.correlationId}`);

        const facturaDTO: FacturaDTO = {
            assetId: factura.assetId,
            facturaUUID: resultQuery,
            deudorNombre: factura.deudorNombre,
            deudorRut: factura.deudorRut,
            facturaNumero: factura.facturaNumero,
            montoTotal: factura.montoTotal,
            fechaVencimiento: factura.fechaVencimiento,
            status: factura.status,
        }

        const mensaje = new MessageDTO(EVENT_CODES.FACTURA_PUBLICADA, EVENT_DESCRIPTIONS.FACTURA_PUBLICADA);

        const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
            CATEGORY_PROCESS.DTE_FACTURA,
            factura.ownerUUID,
            factura.gestor,
            factura.correlationId,
            mensaje,    
            facturaDTO
        );

        this.messagePublisher.publish(
            this.configService.get<string>('rabbitmq.exchange'),
            this.configService.get<string>('rabbitmq.routingKey'),
            notificacionBody,
            { persistent: true, headers: header }
        );
        return true;
    }
}