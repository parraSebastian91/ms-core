
export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface IStorageService {
    getPresignedGetUrl(storageKey: string, correlationId: string): Promise<string>;
}

export interface AvatarImageData {
    url: string;           // URL de la imagen almacenada
    key: string;           // Key/path en el bucket de almacenamiento
    size: number;          // Tamaño del archivo en bytes
    width: number;         // Ancho de la imagen en píxeles
    height: number;        // Alto de la imagen en píxeles
}

export interface AvatarData {
    thumbnail: AvatarImageData;  // Thumbnail muy pequeño (ej: 64x64)
    sm: AvatarImageData;         // Imagen pequeña (ej: 150x150)
    md: AvatarImageData;         // Imagen mediana (ej: 400x400)
    lg: AvatarImageData;         // Imagen grande (ej: 800x800)
    mimetype: 'image/webp';      // Formato de las imágenes
    uploadedAt: string;          // Fecha de carga ISO 8601
    uploadedBy?: string;         // UUID del usuario que subió la imagen (opcional)
}