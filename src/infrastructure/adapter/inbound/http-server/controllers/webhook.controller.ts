/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Inject, Logger, Put, Res, UseFilters } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { Response } from 'express';
import { NotifyModel } from '../model/dto/dteNotification.dto';
import { IFacturaManager } from 'src/core/domain/puertos/inbound/IFacturaPublisher.interface';
import { CATEGORY_PROCESS, EVENT_CODES } from 'src/core/domain/model/constantes.model';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';

@Controller("webhooks")
@Public()
export class WebhookController {

    private readonly logger = new Logger(WebhookController.name);

    constructor(
        @Inject("FACTURA_MANAGER_USE_CASE") private facturaManager: IFacturaManager
    ) { }


    @Put("notify")
    @UseFilters(CoreExceptionFilter)
    async handleWebhook(
        @Body() payload: NotifyModel,
        @Res() response: Response
    ) {
        this.logger.log(`Webhook received with correrlationId: ${payload.correlationId}, category: ${payload.category}, gestor: ${payload.gestor}   `);
        let result: any;
        switch (payload.category) {
            case CATEGORY_PROCESS.DTE_FACTURA:
                result = await this.facturaManager.ExecutePublishFactura(NotifyModel.toModel(payload));
                if (result) {
                    this.logger.log(`Factura procesada exitosamente para correlación: ${payload.correlationId}`);
                } else {
                    this.logger.error(`Error al procesar la factura para correlación: ${payload.correlationId}`);
                }
                break;
            case CATEGORY_PROCESS.DTE_FACTURA_RESPALDO:
                result = await this.facturaManager.ExecuteCargaDocumentoRespaldo(NotifyModel.toModel(payload), payload.category, payload.resource_type, payload.status as EVENT_CODES);
                if (result) {
                    this.logger.log(`Factura procesada exitosamente para correlación: ${payload.correlationId}`);
                } else {
                    this.logger.error(`Error al procesar la factura para correlación: ${payload.correlationId}`);
                }
                break;
            default:
                this.logger.warn(`Unhandled webhook category: ${payload.category}`);
        }

        // Aquí puedes agregar lógica para procesar el payload del webhook
        response.status(200).json({ message: "Webhook recibido correctamente" });
    }

}
