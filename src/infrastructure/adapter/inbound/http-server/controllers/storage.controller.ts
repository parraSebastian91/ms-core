import { Controller, Get, HttpStatus, Inject, Logger, Query, Res, UseFilters, Param } from "@nestjs/common";
import type { Response } from "express";
import { STORAGE_USECASE } from "src/core/application/application.module";
import { IStorage } from "src/core/domain/puertos/inbound/IStorage.iterface";
import { CoreExceptionFilter } from "src/infrastructure/exceptionFileter/contacto.filter";
import { ApiResponse } from "../model/api-response.model";



@Controller('storage')
@UseFilters(CoreExceptionFilter)
export class StorageController {
    private readonly logger = new Logger(StorageController.name);
    constructor(
        @Inject(STORAGE_USECASE) private readonly storageService: IStorage,
    ) {
    }

    @Get('object-url')
    async getObjectUrl(
        @Res() res: Response,
        @Query('UUID') uuid: string,
        @Query('object_type') objectType: string,
        @Query('file_name') fileName: string,
        @Query('content_type') contentType: string,
        @Query('gestor') gestor: string,
        @Query('organization') organization: string,
        @Query('id_factura') idFactura?: string,
        @Query('correlation_id') correlationId?: string,
        @Query('lote_id') loteId?: string,
    ) {
        const date = new Date();
        this.logger.log(`Request received at ${date.toISOString()} correlationId=${correlationId}`);
        const correlationIdValue = correlationId || ''; // Aquí puedes generar o obtener el correlationId según tu lógica
        // Devuelve la key Y el assetId: con la factura creándose recién cuando
        // el worker leyó el documento, el assetId es lo único que el navegador
        // tiene para asociar el archivo que acaba de subir con la fila que está
        // esperando en pantalla.
        const { objectKey, assetId } = await this.storageService.getPutPresignedUrl(
            uuid, gestor, objectType, fileName, contentType, correlationIdValue, organization, idFactura, loteId,
        );
        this.logger.log(`Presigned key generada at ${new Date().toISOString()} correlationId=${correlationIdValue} assetId=${assetId} duration=${new Date().getTime() - date.getTime()}ms`);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Url Generada', { objectKey, assetId }),
        );
    }

    @Get('object-url/:assetId')
    async getObjectUrlByAssetId(
        @Res() res: Response,
        @Param('assetId') assetId: string,
        @Query('orgUuid') orgUuid: string,
        @Query('userUuid') userUuid: string,
        @Query('correlation_id') correlationId?: string,
        @Query('lote_id') loteId?: string,
    ) {
        const date = new Date();
        this.logger.log(`Request received at ${date.toISOString()} correlationId=${correlationId}`);
        const correlationIdValue = correlationId || ''; // Aquí puedes generar o obtener el correlationId según tu lógica
        const url = await this.storageService.getGetPresignedUrl(userUuid, orgUuid, assetId, correlationIdValue);
        console.log(`Generated presigned URL: ${url}`); 
        this.logger.log(`Presigned URL generated at ${new Date().toISOString()} correlationId=${correlationIdValue} duration=${new Date().getTime() - date.getTime()}ms`);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Url Generada', url),
        );
    }

}