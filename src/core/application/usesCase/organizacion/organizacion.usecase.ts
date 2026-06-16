import { Inject, Injectable } from "@nestjs/common";
import { GiroComercialModel, OrganizacionModel } from "src/core/domain/model/organizacion.model";
import { IOrganizacionAdministrator } from "src/core/domain/puertos/inbound/IOrganizacionAdministrator";
import { IOrganizacionRepository, ORGANIZACION_REPOSITORY } from "src/core/domain/puertos/outbound/IOrganizacion.repository";
import { GuardarVerificacionPayload, IVerificacionTributariaRepository } from "src/core/domain/puertos/outbound/IVerificacionTributaria.repository";
import { TributaryService } from "../../service/tributary.service";
import { InsertError } from "src/core/share/errors/Insert.error";
import { ISolicitudAccesoRepository } from "src/core/domain/puertos/outbound/ISolicitudAcceso.repository";

@Injectable()
export class OrganizacionUseCase implements IOrganizacionAdministrator {
    constructor(
        private readonly organizacionRepo: IOrganizacionRepository,
        private readonly tributaryService: TributaryService,
        private readonly verificacionRepo: IVerificacionTributariaRepository,
        private readonly solicitudAccesoRepo: ISolicitudAccesoRepository
    ) { }

    async createOrganizacion(newOrganizacion: OrganizacionModel, usuario: any): Promise<{
        id: string;
        razonSocial: string;
        tipoOrganizacion: string;
        tipoParticipante: string;
        giros: GiroComercialModel[];
    }> {
        const orgCreated = await this.organizacionRepo.createOrganizacion(newOrganizacion);
        if (!orgCreated) {
            throw new InsertError("Error al crear la organización");
        }

        if (newOrganizacion.giros && newOrganizacion.giros.length > 0) {
            await this.verificacionRepo.insertTributaryData(newOrganizacion.rawSii, orgCreated.organizacionId, newOrganizacion.giros[0].fuente);
            for (const giro of newOrganizacion.giros) {
                await this.verificacionRepo.insertActividadEconomica(giro);
            }
            await this.verificacionRepo.soncronizarActividadesEconomicas(orgCreated.organizacionUuid, newOrganizacion.giros[0].fuente, newOrganizacion.giros);
        }
        await this.solicitudAccesoRepo.asociarUsuarioAOrganizacion(orgCreated.organizacionId, usuario.userUuid, "ADMIN", usuario.userUuid);
        return {
            id: orgCreated.organizacionUuid,
            razonSocial: orgCreated.razonSocial,
            tipoOrganizacion: orgCreated.tipoOrganizacion,
            tipoParticipante: orgCreated.tipoParticipante,
            giros: orgCreated.giros
        };
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