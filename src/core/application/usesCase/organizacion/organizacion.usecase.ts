import { Inject, Injectable } from "@nestjs/common";
import { OrganizacionModel } from "src/core/domain/model/organizacion.model";
import { IOrganizacionAdministrator } from "src/core/domain/puertos/inbound/IOrganizacionAdministrator";
import { IOrganizacionRepository, ORGANIZACION_REPOSITORY } from "src/core/domain/puertos/outbound/IOrganizacion.repository";
import { GuardarVerificacionPayload, IVerificacionTributariaRepository, VERIFICACION_TRIBUTARIA_REPOSITORY } from "src/core/domain/puertos/outbound/IVerificacionTributaria.repository";
import { TributaryService } from "../../service/tributary.service";

@Injectable()
export class OrganizacionUseCase implements IOrganizacionAdministrator {
    constructor(
        @Inject(ORGANIZACION_REPOSITORY)
        private readonly organizacionRepo: IOrganizacionRepository,
        private readonly tributaryService: TributaryService,
        @Inject(VERIFICACION_TRIBUTARIA_REPOSITORY)
        private readonly verificacionRepo: IVerificacionTributariaRepository,
    ) { }

    async createOrganizacion(newOrganizacion: OrganizacionModel): Promise<string> {
        const orgCreated = await this.organizacionRepo.createOrganizacion(newOrganizacion);
        if(newOrganizacion.giros && newOrganizacion.giros.length > 0) {
            await this.tributaryService.SincronizarDatosTributarios(orgCreated.organizacionId, newOrganizacion.giros[0].fuente, newOrganizacion.giros ?? []);
        }
        return;
    }

    async checkRut(rut: string): Promise<{ exists: boolean; organizacion?: { id: string; razonSocial: string; tipoPersona: string; tipoParticipante: string; giros: object[] } }> {
        return this.organizacionRepo.checkRut(rut);
    }

    async getVerificacionTributaria(organizacionId: number): Promise<Record<string, any> | null> {
        return this.verificacionRepo.getVerificacionVigente(organizacionId);
    }

    async guardarVerificacion(payload: GuardarVerificacionPayload): Promise<void> {
        return this.verificacionRepo.upsertRaw(payload);
    }
}