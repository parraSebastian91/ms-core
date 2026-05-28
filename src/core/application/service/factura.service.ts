import { FacturaModel, NotaOCR } from "src/core/domain/model/factura.model";
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

    async compararDatosOCRConFactura(facturaOCR: FacturaModel, facturaAlmacenada: FacturaModel): Promise<NotaOCR[]> {
        const notas: NotaOCR[] = [];

        const comparaciones: Array<{ campo: string; declarado: string; ocr: string }> = [
            {
                campo: 'deudor_rut',
                declarado: (facturaAlmacenada.deudorRut ?? '').trim().toUpperCase(),
                ocr: (facturaOCR.deudorRut ?? '').trim().toUpperCase(),
            },
            {
                campo: 'deudor_nombre',
                declarado: (facturaAlmacenada.deudorNombre ?? '').trim().toUpperCase(),
                ocr: (facturaOCR.deudorNombre ?? '').trim().toUpperCase(),
            },
            {
                campo: 'factura_numero',
                declarado: (facturaAlmacenada.facturaNumero ?? '').trim(),
                ocr: (facturaOCR.facturaNumero ?? '').trim(),
            },
            {
                campo: 'monto_total',
                declarado: String(facturaAlmacenada.montoTotal ?? '').trim(),
                ocr: String(facturaOCR.montoTotal ?? '').trim(),
            },
        ];

        for (const { campo, declarado, ocr } of comparaciones) {
            if (ocr && declarado !== ocr) {
                notas.push({
                    campo,
                    valor_declarado: declarado,
                    valor_ocr: ocr,
                    nota: `Campo "${campo}": el formulario indica "${declarado}" pero el OCR detectó "${ocr}".`,
                });
            }
        }

        return notas;
    }

}