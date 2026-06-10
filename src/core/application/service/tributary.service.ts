import { Injectable } from "@nestjs/common";
import { GiroComercialModel } from "src/core/domain/model/organizacion.model";
import { ITributaryService } from "src/core/domain/puertos/inbound/ITibutaryService.interface";
import { IVerificacionTributariaRepository } from "src/core/domain/puertos/outbound/IVerificacionTributaria.repository";

@Injectable()
export class TributaryService implements ITributaryService {

    constructor(
        private readonly tributaryRepo: IVerificacionTributariaRepository, // Este repositorio se encargaría de la lógica específica de verificación tributaria (SII, AFIP, etc.)
    ) { }

    async SincronizarDatosTributarios(organizacionId: number, fuente: string, giro: GiroComercialModel[]): Promise<void> {
        
    }
}