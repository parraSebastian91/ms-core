import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CATEGORY_PROCESS, EVENT_CODES, EVENT_DESCRIPTIONS, facturaEstado, PERMISO_RECURSO, TIPO_PARTICIPANTE, TIPO_PERMISO } from "src/core/domain/model/constantes.model";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { FacturaUpdateModel } from "src/core/domain/model/facturaUpdate.model";
import { IFacturaManager, AutorizacionPublicacionPayload, VersionTerminosRecord } from "src/core/domain/puertos/inbound/IFacturaPublisher.interface";
import { IFacturaService } from "src/core/domain/puertos/inbound/IFacturaService.interface";
import { IMessagePublisher } from "src/core/domain/puertos/inbound/message.publisher.interface";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { IStorageService } from "src/core/domain/puertos/outbound/IStorageService.interface";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";
import { IWorkTeamRepository } from "src/core/domain/puertos/outbound/IWorkTeam.rerpository";
import { FacturaCreateError } from "src/core/share/errors/FacturaCreate.error";
import { UserAndOrgError } from "src/core/share/errors/UserAndOrg.error";
import { FacturaDTO } from "src/infrastructure/adapter/outbound/queue/dto/factura.dto";
import { MessageDTO, NotificacionDTO } from "src/infrastructure/adapter/outbound/queue/dto/Notificacion.dto";

export class FacturaManagerUseCase implements IFacturaManager {

    private readonly logger = new Logger(FacturaManagerUseCase.name);

    constructor(
        private readonly facturaRepository: IFacturaManagerRepository,
        private readonly userProfileRepository: IUserProfileRepository,
        private readonly workTeamRepository: IWorkTeamRepository,
        private readonly messagePublisher: IMessagePublisher,
        private configService: ConfigService,
        private readonly storageServiceAdapter: IStorageService,
        private readonly facturaService: IFacturaService
    ) { }

    async ExecutePublishFactura(factura: FacturaModel): Promise<boolean> {
        this.logger.log(`Ejecutando publicación de factura, correlación: ${factura.correlationId}`);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const gestorUsername = typeof factura.gestor === "string" ? factura.gestor : factura.gestor.username;
        const validateUserAndOrganizacion = await this.userProfileRepository.getUserProfileByUsername(gestorUsername, factura.ownerUUID);

        const header: Record<string, unknown> = {
            correlationId: factura.correlationId,
        };

        if (factura.gestor && typeof factura.gestor === "string" && !isUUID.test(factura.gestor) && validateUserAndOrganizacion.isValid) {
            factura.gestor = {
                uuid: validateUserAndOrganizacion.profile.usuario_uuid,
                username: gestorUsername
            }
        }

        const publishNotification = (
            routingKey: string,
            mensaje: MessageDTO,
            facturaDTO: FacturaDTO,
            customHeaders?: Record<string, unknown>
        ) => {
            const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
                CATEGORY_PROCESS.DTE_FACTURA,
                factura.ownerUUID,
                gestorUsername,
                factura.correlationId,
                mensaje,
                facturaDTO
            );

            this.messagePublisher.publish(
                this.configService.get<string>('rabbitmq.exchange'),
                routingKey,
                notificacionBody,
                { persistent: true, headers: customHeaders ?? header }
            );
        };

        if (!validateUserAndOrganizacion.isValid) {
            this.logger.error(`Error de validación de usuario y organización para correlación: ${factura.correlationId}`);
            publishNotification(
                this.configService.get<string>('rabbitmq.routingKeyFail'),
                new MessageDTO(EVENT_CODES.FACTURA_ERROR_VALIDACION, EVENT_DESCRIPTIONS.FACTURA_ERROR_VALIDACION, true),
                new FacturaDTO()
            );
            return false;
        }

        const resultQuery = await this.facturaRepository.publishFactura(factura);
        if (resultQuery.includes("unique_factura_emisor_folio")) {
            this.logger.warn(`Factura duplicada detectada para correlación: ${factura.correlationId}`);
            publishNotification(
                this.configService.get<string>('rabbitmq.routingKeyFail'),
                new MessageDTO(EVENT_CODES.FACTURA_DUPLICADA, EVENT_DESCRIPTIONS.FACTURA_DUPLICADA, true),
                new FacturaDTO()
            );
            return false;
        }

        if (resultQuery.includes("error")) {
            const emptyFactura = new FacturaModel(factura.ownerUUID, factura.gestor, facturaEstado.PENDIENTE_VALIDACION, factura.correlationId);
            this.logger.warn(`Error al publicar la factura: ${factura.facturaNumero}`);

            const fallbackResult = await this.facturaRepository.publishFactura(emptyFactura);
            if (fallbackResult && !fallbackResult.includes("error")) {
                this.logger.log(`Factura vacía publicada para notificaciones, correlación: ${factura.correlationId}`);
                const facturaDTO: FacturaDTO = {
                    facturaUUID: fallbackResult,
                    assetId: emptyFactura.assetId,
                    deudorNombre: emptyFactura.deudorNombre,
                    deudorRut: emptyFactura.deudorRut,
                    facturaNumero: emptyFactura.facturaNumero,
                    montoTotal: emptyFactura.montoTotal,
                    fechaVencimiento: emptyFactura.fechaVencimiento,
                    status: emptyFactura.status,
                };

                publishNotification(
                    this.configService.get<string>('rabbitmq.routingKeyFail'),
                    new MessageDTO(EVENT_CODES.FACTURA_VACIA_PUBLICADA, EVENT_DESCRIPTIONS.FACTURA_VACIA_PUBLICADA, true),
                    facturaDTO,
                    { ...header, error: "factura_vacia" }
                );
                return false;
            }

            this.logger.error(`Error al publicar la factura vacía para correlación: ${factura.correlationId}`);
            publishNotification(
                this.configService.get<string>('rabbitmq.routingKeyFail'),
                new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, true),
                new FacturaDTO()
            );
            return false;
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
        };

        publishNotification(
            this.configService.get<string>('rabbitmq.routingKey'),
            new MessageDTO(EVENT_CODES.FACTURA_PUBLICADA_PENDIENTE_VALIDACION, EVENT_DESCRIPTIONS.FACTURA_PUBLICADA_PENDIENTE_VALIDACION),
            facturaDTO
        );

        return true;
    }

    async ExecutePublicarFormFactura(factura: FacturaModel): Promise<FacturaModel> {
        let mensaje = new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, false);


        const validateUserAndOrganizacion = await this.userProfileRepository.validateUserAndOrganizacion(factura.gestor.uuid, factura.ownerUUID);
        //subo la factura al repositorio de bse de datos
        if (!validateUserAndOrganizacion) {
            this.logger.error(`Error de validación de usuario y organización para correlación: ${factura.correlationId}`);
            mensaje = new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, true);
        } else {
            // 2 opciones, Puede existir o no el registro de factura, por lo que se valida si existe.
            // si existe, se valvida que no este publicada. por facturaNumero y idOrganbizacion.
            // si no existe, se crea con estado pendiente de autorizacion, y si el estado es PROCESANDO, se actualiza a publicado, si el estado es PENDIENTE_AUTORIZACION, se mantiene el estado enviado y no se manda a notificaciones.

            let existeFactura = await this.facturaRepository.facturaExiste(factura.publiInvoiceId, factura.facturaNumero, factura.ownerUUID);
            let resultadoCreacionPermisos;
            const statusInRequest = factura.status;
            // Primer If: La factura existe y tiene un publiInvoiceId válido, se intenta actualizar el estado a publicado.
            if (existeFactura && factura.publiInvoiceId && factura.publiInvoiceId !== '') {
                // Si existe registro de factura en base de datos, se vvalida estado PROCESANDO para asi permitir permisos de lectura a quien corresponda.
                // si tiene estado PENDIENTE_AUTORIZACION, no se generan los permisos de lectura, quedando la factura en estado PENDIENTE_AUTORIZACION, notificando al usuario que debe aceptar los terminos de publicacion.

                if (statusInRequest === facturaEstado.PENDIENTE_AUTORIZACION) {
                    this.logger.warn(`Factura pendiente de autorización, debe autorizar para poder publicar la factura, correlación: ${factura.correlationId}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_PENDIENTE_AUTORIZACION, EVENT_DESCRIPTIONS.FACTURA_PENDIENTE_AUTORIZACION, true);
                }

                const resultQuery = await this.facturaRepository.updateFacturaState(factura, statusInRequest);
                if (!resultQuery.isUpdate) {
                    this.logger.warn(`No se pudo actualizar el estado de la factura, verifica que el ID sea correcto y que la factura exista, facturaID: ${factura.publiInvoiceId}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, true);
                }

                if (statusInRequest === facturaEstado.PROCESANDO && resultQuery.isUpdate) {
                    this.logger.log(`Factura publicada exitosamente para correlación: ${factura.correlationId}`);
                    resultadoCreacionPermisos = await this.facturaService.GrantAccess_OrganizationByTipoParticipante(
                        PERMISO_RECURSO.FACTURA, TIPO_PARTICIPANTE.FINANCIADORA, factura.publiInvoiceId, factura.gestor.uuid, [TIPO_PERMISO.VISTA], "Permisos para la visualización de factura publicada");
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_PUBLICADA, EVENT_DESCRIPTIONS.FACTURA_PUBLICADA + ` Financieras Notificadas: ${resultadoCreacionPermisos}`, false, true);
                }
                // Segundo If: La factura existe y se intenta publicar nuevamente, se notifica factura duplicada.
            } else if (existeFactura && (!factura.publiInvoiceId || factura.publiInvoiceId === '')) {
                this.logger.warn(`Factura Duplicada, ya existe una factura con el mismo número para la organización, facturaNumero: ${factura.facturaNumero}`);
                mensaje = new MessageDTO(EVENT_CODES.FACTURA_DUPLICADA, EVENT_DESCRIPTIONS.FACTURA_DUPLICADA, true);
                // ultimo caso: La factura no existe, se crea con estado PROCESANDO.
            } else {
                factura.status = facturaEstado.PUBLICADA;
                const resultQuery = await this.facturaRepository.publishFactura(factura);
                if (statusInRequest === facturaEstado.PENDIENTE_AUTORIZACION) {
                    this.logger.warn(`Factura pendiente de autorización, debe autorizar para poder publicar la factura, correlación: ${factura.correlationId}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_PENDIENTE_AUTORIZACION, EVENT_DESCRIPTIONS.FACTURA_PENDIENTE_AUTORIZACION, true);
                } else {
                    resultadoCreacionPermisos = await this.facturaService.GrantAccess_OrganizationByTipoParticipante(
                        PERMISO_RECURSO.FACTURA, TIPO_PARTICIPANTE.FINANCIADORA, resultQuery, factura.gestor.uuid, [TIPO_PERMISO.VISTA], "Permisos para la visualización de factura publicada");
                }

                if (resultQuery.includes("error")) {
                    this.logger.error(`Error al publicar la factura para correlación: ${factura.correlationId}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_ERROR_PROCESAMIENTO, EVENT_DESCRIPTIONS.FACTURA_ERROR_PROCESAMIENTO, true);
                } else if (statusInRequest && statusInRequest !== facturaEstado.PENDIENTE_AUTORIZACION) {
                    this.logger.warn(`Factura Duplicada, ya existe una factura con el mismo número para la organización, facturaNumero: ${factura.facturaNumero}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_PENDIENTE_AUTORIZACION, EVENT_DESCRIPTIONS.FACTURA_PENDIENTE_AUTORIZACION, true);
                } else {
                    this.logger.log(`Factura publicada exitosamente para correlación: ${factura.correlationId}`);
                    mensaje = new MessageDTO(EVENT_CODES.FACTURA_PUBLICADA, EVENT_DESCRIPTIONS.FACTURA_PUBLICADA + ` Financieras Notificadas: ${resultadoCreacionPermisos}`, false, true);
                }
                factura.publiInvoiceId = resultQuery;
            }
        }

        const notificacionBody: NotificacionDTO<FacturaDTO> = new NotificacionDTO<FacturaDTO>(
            CATEGORY_PROCESS.DTE_FACTURA,
            factura.ownerUUID,
            factura.gestor.username,
            factura.correlationId,
            mensaje,
            factura
        );
        console.log(notificacionBody);
        this.messagePublisher.publish(
            this.configService.get<string>('rabbitmq.exchange'),
            this.configService.get<string>('rabbitmq.routingKey'),
            notificacionBody,
            { persistent: true }
        );

        if (mensaje.error) {
            throw new FacturaCreateError(mensaje.description);
        }
        return factura;
    }

    async ExecuteGetFacturas(usuario: string, orgUUID: string): Promise<FacturaModel[]> {
        let isLeader = await this.workTeamRepository.isLeaderOfWorkTeam(usuario, orgUUID);
        if (orgUUID !== "Todas") {
            const validateUserAndOrganizacion = await this.userProfileRepository.validateUserAndOrganizacion(usuario, orgUUID);
            if (!validateUserAndOrganizacion) {
                this.logger.error(`Error de validación de usuario y organización para consulta de facturas, usuario: ${usuario}, organización: ${orgUUID}`);
                throw new UserAndOrgError("Error de validación de usuario y organización");
            }
        }
        return await this.facturaRepository.getFacturas(usuario, orgUUID, isLeader);
    }

    async ExecuteUpdateFactura(factura: FacturaUpdateModel): Promise<{ campo: string, id: string, valor: any, isUpdate: any, mensaje: string }> {
        const validateUserAndOrganizacion = await this.userProfileRepository.validateUserAndOrganizacion(factura.gestor, factura.ownerUUID);
        if (!validateUserAndOrganizacion) {
            this.logger.error(`Error de validación de usuario y organización para actualización de factura, usuario: ${factura.gestor}, organización: ${factura.ownerUUID}`);
            throw new UserAndOrgError("Error de validación de usuario y organización");
        }
        const facturaEsEditable = await this.facturaRepository.validateFacturaEditable(factura.id);
        if (!facturaEsEditable) {
            this.logger.error(`La factura no es editable, facturaID: ${factura.id}`);
            throw new Error("La factura no es editable");
        }
        const { id, valor, isUpdate, mensaje } = await this.facturaRepository.updateFactura(factura);
        return { campo: factura.campoEditado.nombre, id, valor, isUpdate, mensaje };
    }

    async ExecuteGetUrlFacturas(facturaID: string[], correlationId: string): Promise<{ id: string, keyUrl: string }[]> {
        const result = await this.facturaRepository.getFacturaKey(facturaID);
        const presignedUrls = await Promise.all(result.map(async (item) => {
            const keyUrl = await this.storageServiceAdapter.getPresignedGetUrl(item.keyUrl, correlationId);
            return { id: item.id, keyUrl };
        }));
        return presignedUrls || [];
    }

    async ExecuteGetVersionTerminosActiva(): Promise<VersionTerminosRecord> {
        this.logger.log('[START] GetVersionTerminosActiva');
        return this.facturaRepository.getVersionTerminosActiva();
    }

    async ExecuteRegistrarAutorizacion(payload: AutorizacionPublicacionPayload): Promise<void> {
        this.logger.log(`[START] RegistrarAutorizacion | facturaId=${payload.facturaId} | usuarioUUID=${payload.usuarioUUID} | acepto=${payload.acepto}`);

        await this.facturaRepository.registrarAutorizacion(payload);
        if (payload.acepto) {
           this.facturaService.GrantAccess_OrganizationByTipoParticipante(
                PERMISO_RECURSO.FACTURA,
                TIPO_PARTICIPANTE.FINANCIADORA,
                payload.facturaId,
                payload.usuarioUUID,
                [TIPO_PERMISO.VISTA],
                `Permisos para la visualización de factura publicada tras aceptación de términos, versiónTerminosId: ${payload.versionTerminosId}`
            );
        }

        this.logger.log(`[OK] RegistrarAutorizacion | facturaId=${payload.facturaId}`);
    }

}