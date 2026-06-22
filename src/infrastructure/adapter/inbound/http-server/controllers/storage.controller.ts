import { Controller, Get, HttpStatus, Inject, Logger, Query, Res, UseFilters } from "@nestjs/common";
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
    ) {
        const date = new Date();
        this.logger.log(`Request received at ${date.toISOString()} correlationId=${correlationId}`);
        const correlationIdValue = correlationId || ''; // Aquí puedes generar o obtener el correlationId según tu lógica
        const url = await this.storageService.getPutPresignedUrl(uuid, gestor, objectType, fileName, contentType, correlationIdValue, organization, idFactura);
        console.log(`Generated presigned URL: ${url}`);
        this.logger.log(`Presigned URL generated at ${new Date().toISOString()} correlationId=${correlationIdValue} duration=${new Date().getTime() - date.getTime()}ms`);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Url Generada', url),
        );
    }

}