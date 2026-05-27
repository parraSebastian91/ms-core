import { FacturaModel } from "src/core/domain/model/factura.model";
import { IFacturaService } from "src/core/domain/puertos/inbound/IFacturaService.interface";
import { IPermisosManagerService } from "src/core/domain/puertos/inbound/IPermisosManagerService.interface";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { IOrganizacionRepository } from "src/core/domain/puertos/outbound/IOrganizacion.repository";

export class FacturaServiceImplement implements IFacturaService {

    constructor(
        private readonly permisosManagerService: IPermisosManagerService,
        private readonly organizacionRepository: IOrganizacionRepository,
        private readonly facturaRepository: IFacturaManagerRepository,
    ) { }

    async GrantAccess_OrganizationByTipoParticipante(
        tipoRecurso: string,
        TipoParticipante: string,
        resourceId: string,
        userGrante: string,
        permissions: string[],
        razon_descripcion: string
    ): Promise<number> {
        let organizacionesAfectadas = 0;

        const organizaciones = await this.organizacionRepository.getOrganizacionesByTipoParticipante(TipoParticipante);
        for (const org of organizaciones) {
            organizacionesAfectadas += await this.permisosManagerService.GrantAccess_Organization(tipoRecurso, resourceId, userGrante, org.organizacionUuid, permissions, razon_descripcion);
        }
        return organizacionesAfectadas;
    }

    async compararDatosOCRConFactura(factura: FacturaModel): Promise<boolean> {
        // Lógica para comparar los datos OCR con la factura
        return true;
    }

}