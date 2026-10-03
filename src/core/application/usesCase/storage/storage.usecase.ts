import { ConfigService } from '@nestjs/config';

import { CATEGORY_PROCESS, MEDIA_TYPE } from "src/core/domain/model/constantes.model";
import { StorageMediaModel } from "src/core/domain/model/storageMedia.model";
import { IStorage } from "src/core/domain/puertos/inbound/IStorage.iterface";
import { IStorageMediaRepository } from "src/core/domain/puertos/outbound/IMedia.repository";

export class storageUsecase implements IStorage {
    constructor(
        private readonly mediaRepository: IStorageMediaRepository,
        private readonly configService: ConfigService,
    ) {}

    async getPutPresignedUrl(
        UUID: string,
        Gestor: string,
        ObjectType: string,
        FileName: string,
        ContentType: string,
        CorrelationId: string,
        Organization: string,
        idFactura?: string,
        loteId?: string
    ): Promise<{ objectKey: string; assetId: string }> {

        const extension = this.sanitizeObjectKeyExtension(ContentType);
        let objectKey: string;
        let mediaType: string;
        switch (ObjectType) {
            case CATEGORY_PROCESS.USER_AVATAR:
                objectKey = `private/profile-pictures/${Organization}/${ObjectType}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_IMAGE;
                break;
            case CATEGORY_PROCESS.USER_BANNER:
                objectKey = `private/profile-banners/${Organization}/${ObjectType}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_IMAGE;
                break;
            case CATEGORY_PROCESS.ORG_AVATAR:
                objectKey = `private/org-avatars/${Organization}/${ObjectType}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_IMAGE;
                break;
            case CATEGORY_PROCESS.ORG_BANNER:
                objectKey = `private/org-banners/${Organization}/${ObjectType}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_IMAGE;
                break;
            case CATEGORY_PROCESS.DOCUMENT_DTE:
                // Una factura que nace de su propio documento todavía NO existe:
                // el archivo se sube primero y la factura se crea cuando el
                // worker lo leyó y se validó que no sea duplicada ni ilegible.
                // Colgar la key de un `idFactura` obligaba al orden inverso y
                // dejaba filas de factura muertas por cada documento rechazado.
                //
                // `uploads/` es el estacionamiento: el archivo vive ahí y la
                // factura, cuando nace, apunta a esa key. No hay que mover nada
                // —copiar y borrar en S3 no es gratis— y el `media_asset` es la
                // fila que garantiza que ningún archivo subido quede sin rastro.
                //
                // Con `idFactura` se mantiene el camino de siempre: volver a
                // subir el documento de una factura que YA existe.
                objectKey = idFactura
                    ? `private/org-documents/${Organization}/factura/${idFactura}/`
                    : `private/org-documents/${Organization}/uploads/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_DTE_RESPALDO:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_OC:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_HES:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_GD:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_AE:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
            case CATEGORY_PROCESS.DOCUMENT_EP:
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
                mediaType = MEDIA_TYPE.MEDIA_TYPE_DOCUMENT;
                break;
        }

        const StoraMEdiaModel: StorageMediaModel = {
            ownerid: idFactura,
            AssetId: "",
            ResourceId: UUID,
            ResourceType: ObjectType,
            OwnerUUID: Organization,
            Gestor: Gestor,
            MediaType: mediaType,
            CategoryProcess: ObjectType,
            NameFile: FileName,
            FormatFile: ContentType,
            StorageKey: objectKey,
            CorrelationId: CorrelationId
        }

        const media = await this.mediaRepository.createMediaObject(StoraMEdiaModel);

        // La pertenencia a una tanda se registra en el ARCHIVO, no en la
        // factura: cuando la persona confirmó la tanda las facturas todavía no
        // existían. La factura lo hereda de su adjunto principal al crearse.
        if (loteId) {
            await this.mediaRepository.asignarLote(media.AssetId, loteId);
        }

        const newObject = `${objectKey}${ObjectType}_${media.AssetId}.${extension}`.replace(/ /g, '_');

        // `addAssets` escribe en `factura.factura_adjuntos`, que necesita un
        // `factura_id`. Si la factura todavía no existe no hay a qué adjuntar:
        // ese enlace lo crea el webhook cuando la factura nace, con el mismo
        // assetId. Intentarlo acá insertaría un adjunto huérfano.
        const puedeAdjuntar = Boolean(idFactura);
        const tareas: Promise<unknown>[] = [
            this.mediaRepository.updateMediaObjectKey(media.AssetId, newObject),
        ];
        if (puedeAdjuntar) {
            tareas.push(this.mediaRepository.addAssets(media, ObjectType));
        }
        await Promise.all(tareas);

        return { objectKey: newObject, assetId: media.AssetId };
    }

    async getGetPresignedUrl(userUuid: string, orgUuid: string, assetId: string, correlationId: string): Promise<{ objectKey: string, ttlSeconds: number }> {
        const media = await this.mediaRepository.getMediaKey(userUuid, orgUuid, assetId, correlationId);
        if (!media) {
            throw new Error(`No se encontró un objeto de medios para el usuario con UUID: ${userUuid}`);
        }
        return { objectKey: media.storageKey, ttlSeconds: this.configService.get<number>('app.ttlGetObject') };

    }

    private sanitizeObjectKeyExtension(value: string): string {
        let v = value.replace(/^\./, '').trim();
        if (v.includes('/')) {
            const parts = v.split('/');
            v = parts[parts.length - 1];
        }
        v = this.sanitizeObjectKeySegment(v);
        v = v.toLowerCase();
        if (v === 'file') {
            return 'bin';
        }
        return v;
    }

    private sanitizeObjectKeySegment(value: string): string {
        let v = value.trim();
        v = v.replace(/ /g, '_');
        v = v.replace(/[^a-zA-Z0-9._-]/g, '_');
        v = v.replace(/_+/g, '_');
        v = v.replace(/^[._-]+|[._-]+$/g, '');
        if (v === '') {
            return 'file';
        }
        return v;
    }

}