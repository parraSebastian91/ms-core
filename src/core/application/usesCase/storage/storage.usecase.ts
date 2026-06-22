import { CATEGORY_PROCESS, MEDIA_TYPE } from "src/core/domain/model/constantes.model";
import { StorageMediaModel } from "src/core/domain/model/storageMedia.model";
import { IStorage } from "src/core/domain/puertos/inbound/IStorage.iterface";
import { IStorageMediaRepository } from "src/core/domain/puertos/outbound/IMedia.repository";

export class storageUsecase implements IStorage {

    constructor(
        private readonly mediaRepository: IStorageMediaRepository
    ) { }

    async getPutPresignedUrl(
        UUID: string,
        Gestor: string,
        ObjectType: string,
        FileName: string,
        ContentType: string,
        CorrelationId: string,
        Organization: string,
        idFactura?: string
    ): Promise<string> {

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
                objectKey = `private/org-documents/${Organization}/factura/${idFactura}/`;
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

        const newObject = `${objectKey}${ObjectType}_${media.AssetId}.${extension}`;

        // await this.mediaRepository.updateMediaObjectKey(media.AssetId, newObject);
        // await this.mediaRepository.addAssets(media, ObjectType);
        await Promise.allSettled([
            this.mediaRepository.addAssets(media, ObjectType),
            this.mediaRepository.updateMediaObjectKey(media.AssetId, newObject)
        ]);
        return newObject;
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