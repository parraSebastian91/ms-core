export interface IStorage {
    getPutPresignedUrl(
        UUID: string,
        Gestor: string,
        ObjectType: string,
        FileName: string,
        ContentType: string,
        CorrelationId: string,
        Organization: string,
        idFactura?: string
    ): Promise<string>;
    getGetPresignedUrl(
        userUuid: string,
        orgUuid: string,
        assetId: string,
        correlationId: string
    ): Promise<{ objectKey: string, ttlSeconds: number }>;
}