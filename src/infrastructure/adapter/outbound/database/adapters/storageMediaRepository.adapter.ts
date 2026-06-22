import { InjectDataSource } from "@nestjs/typeorm";
import { CATEGORY_PROCESS, EVENT_CODES } from "src/core/domain/model/constantes.model";
import { StorageMediaModel } from "src/core/domain/model/storageMedia.model";
import { IStorageMediaRepository } from "src/core/domain/puertos/outbound/IMedia.repository";
import { DataSource } from "typeorm";

export class StorageMEdiaRepositoryAdapter implements IStorageMediaRepository {

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async createMediaObject(model: StorageMediaModel): Promise<StorageMediaModel> {
        try {
            const rows = await this.dataSource.query(
                `INSERT INTO media.media_assets (
                owner_id,
                m_type,
                category,
                status,
                original_name,
                mime_type,
                storage_key,
                correlation_id,
                gestor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [
                    model.OwnerUUID,
                    model.MediaType,
                    model.CategoryProcess,
                    EVENT_CODES.STATE_PROCESS_PENDING,
                    model.NameFile,
                    model.FormatFile,
                    model.StorageKey,
                    model.CorrelationId,
                    model.Gestor,
                ],
            );
            const mediaId = rows[0].id;
            model.AssetId = mediaId;
            return model;
        } catch (error) {
            // Manejo de errores, puedes lanzar una excepción personalizada o registrar el error
            console.error('Error al crear el objeto de media:', error);
            throw new Error('Error al crear el objeto de media');
        }
    }

    async updateMediaObjectKey(mediaId: string, storageKey: string): Promise<void> {
        try {
            await this.dataSource.query(
                `UPDATE media.media_assets
                 SET storage_key = $1
                 WHERE id = $2`,
                [storageKey, mediaId]
            );
        } catch (error) {
            console.error('Error al actualizar la clave de almacenamiento del objeto de media:', error);
            throw new Error('Error al actualizar la clave de almacenamiento del objeto de media');
        }
    }

    async addAssets(media: StorageMediaModel, objectType: string): Promise<boolean> {
        let query = '';
        let params: any[] = [];
        let isPrincipal = false;
        switch (objectType) {
            case CATEGORY_PROCESS.DOCUMENT_OC:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    3,
                    'Orden de compra (OC)',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_GD:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    4,
                    'Guía de despacho',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_AE:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    5,
                    'Acta de entrega',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_EP:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`                                
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    6,
                    'Estado de pago',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_HES:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    7,
                    'Hoja entrada de servicio (HES)',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_DTE:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`
                isPrincipal = true;                                   
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    1,
                    'Respaldo Factura DTE',
                ];
                break;
            case CATEGORY_PROCESS.DOCUMENT_DTE_RESPALDO:
                query = `INSERT INTO factura.factura_adjuntos ( factura_id, asset_id, tipo, es_principal, orden, descripcion) 
                                VALUES($1, $2, $3, $4, $5, $6);`                                                
                params = [
                    media.ownerid,
                    media.AssetId,
                    objectType,
                    isPrincipal,
                    2,
                    'Respaldo Factura DTE',
                ];
                break;
        }
        try {
            await this.dataSource.query(query, params);
            return true;
        } catch (error) {
            console.error('Error al agregar assets al objeto de media:', error);
            return false;
        }
    }
}