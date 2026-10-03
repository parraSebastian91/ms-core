import { StorageMediaModel } from '../../model/storageMedia.model';

export interface IStorageMediaRepository {
  createMediaObject(media: StorageMediaModel): Promise<StorageMediaModel>;
  updateMediaObjectKey(mediaId: string, storageKey: string): Promise<void>;
  /** Marca que este archivo pertenece a una tanda de publicación. */
  asignarLote(mediaId: string, loteId: string): Promise<void>;
  addAssets(media: StorageMediaModel, objectType: string): Promise<boolean>;
  getMediaKey(
    userUuid: string,
    orgUuid: string,
    assetId: string,
    correlationId: string,
  ): Promise<{ storageKey: string; auditId: string } | null>;
}
