import { Logger } from "@nestjs/common";
import { EVENT_CODES, EVENT_DESCRIPTIONS, facturaEstado, RESOURCE_TYPE, TIPO_PARTICIPANTE, TIPO_PERMISO } from "src/core/domain/model/constantes.model";
import { FacturaModel, NotaOCR } from "src/core/domain/model/factura.model";
import { CampoFactura } from "src/core/domain/model/facturaUpdate.model";
import { IFacturaService } from "src/core/domain/puertos/inbound/IFacturaService.interface";
import { IPermisosManagerService } from "src/core/domain/puertos/inbound/IPermisosManagerService.interface";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { IOrganizacionRepository } from "src/core/domain/puertos/outbound/IOrganizacion.repository";
import { MessageDTO } from "src/infrastructure/adapter/outbound/queue/dto/Notificacion.dto";

export class FacturaServiceImplement implements IFacturaService {
    private readonly logger = new Logger(FacturaServiceImplement.name);
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

        const comparaciones: Array<{ campo: CampoFactura; declarado: string; ocr: string }> = [
            {
                campo: CampoFactura.RUT_DEUDOR,
                declarado: (facturaAlmacenada.deudorRut ?? '').trim().toUpperCase(),
                ocr: (facturaOCR.deudorRut ?? '').trim().toUpperCase(),
            },
            {
                campo: CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR,
                declarado: (facturaAlmacenada.deudorNombre ?? '').trim().toUpperCase(),
                ocr: (facturaOCR.deudorNombre ?? '').trim().toUpperCase(),
            },
            {
                campo: CampoFactura.NUMERO_FACTURA,
                declarado: (facturaAlmacenada.facturaNumero ?? '').trim(),
                ocr: (facturaOCR.facturaNumero ?? '').trim(),
            },
            {
                campo: CampoFactura.MONTO_TOTAL,
                declarado: String(facturaAlmacenada.montoTotal ?? '').trim(),
                ocr: String(facturaOCR.montoTotal ?? '').trim(),
            },
        ];

        for (const { campo, declarado, ocr } of comparaciones) {
            if (ocr && ocr.includes(';')) {
                notas.push({
                    campo,
                    valor_declarado: declarado,
                    valor_ocr: ocr,
                    nota: `Campo "${campo}": El Sistema detectó Multiple valores.`,
                });
            } else if (ocr && declarado !== ocr && !ocr.includes(';')) {
                notas.push({
                    campo,
                    valor_declarado: declarado,
                    valor_ocr: ocr,
                    nota: `Campo "${campo}": el formulario indica "${declarado}" pero el sistema detectó "${ocr}".`,
                });
            }
        }

        return notas;
    }

    async RevokeAccess_OrganizationByTipoParticipante(
        tipoRecurso: string,
        TipoParticipante: string,
        resourceId: string,
        permissions: string[],
    ): Promise<number> {
        let organizacionesAfectadas = 0;
        const organizaciones = await this.organizacionRepository.getOrganizacionesByTipoParticipante(TipoParticipante);
        for (const org of organizaciones) {
            organizacionesAfectadas += await this.permisosManagerService.RevokeAccess_Organization(tipoRecurso, resourceId, org.organizacionUuid, permissions);
        }
        return organizacionesAfectadas;
    }

    async guardarNotasOCR(factura: FacturaModel, facturaAlmacenada: FacturaModel): Promise<MessageDTO> {
        const notas = await this.compararDatosOCRConFactura(factura, facturaAlmacenada);
        let mensaje: MessageDTO;

        if (notas.length > 0) {
            await this.facturaRepository.guardarNotasOCR(factura.publiInvoiceId, notas);
            this.logger.warn(`[ExecuteCargaDocumentoRespaldo] ${notas.length} discrepancia(s) OCR | facturaId=${factura.publiInvoiceId}`);
            mensaje = new MessageDTO(
                EVENT_CODES.FACTURA_CON_DISCREPANCIAS_OCR,
                EVENT_DESCRIPTIONS.FACTURA_CON_DISCREPANCIAS_OCR,
                true,
            );

            this.facturaRepository.updateFacturaState(factura, facturaEstado.PENDIENTE_VALIDACION).then(() => {
                this.logger.warn(`Factura ${factura.publiInvoiceId} actualizada a estado PENDIENTE_VALIDACION por discrepancias OCR`);
            }).catch((error) => {
                this.logger.error(`Error actualizando estado de factura ${factura.publiInvoiceId} a PENDIENTE_VALIDACION: ${error.message}`, error.stack);
            });

            this.RevokeAccess_OrganizationByTipoParticipante(
                RESOURCE_TYPE.FACTURA,
                TIPO_PARTICIPANTE.FINANCIADORA,
                factura.publiInvoiceId,
                [TIPO_PERMISO.VISTA],
            ).then((orgsAfectadas) => {
                this.logger.warn(`Permisos de visualización revocados para ${orgsAfectadas} organización(es) del tipo "cliente_cedente" | facturaId=${factura.publiInvoiceId}`);
            }).catch((error) => {
                this.logger.error(`Error revocando permisos de visualización para facturaId=${factura.publiInvoiceId}: ${error.message}`, error.stack);
            });

            //TODO: si la factura esta publicada, se debe cambiarrr rde estado a PENDIENTE_AVLIDACION
            //TODO: se deben revocar todos los permisos de vvisualizacion actuales, y esperar que el cliente rerctifique informacion.
            //QUESTION: se debe volver a autorizar la publicacion de factura?
        } else {
            mensaje = new MessageDTO(
                EVENT_CODES.FACTURA_RESPALDO_SIN_DISCREPANCIAS,
                EVENT_DESCRIPTIONS.FACTURA_RESPALDO_SIN_DISCREPANCIAS,
                false,
            );
        }
        return mensaje;
    }

}