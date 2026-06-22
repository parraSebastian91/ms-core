import { StorageMediaModel } from "../../model/storageMedia.model";

export interface IStorageMediaRepository {
    createMediaObject(media: StorageMediaModel): Promise<StorageMediaModel>;
    updateMediaObjectKey(mediaId: string, storageKey: string): Promise<void>;
    addAssets(media: StorageMediaModel, objectType: string): Promise<boolean>;
}