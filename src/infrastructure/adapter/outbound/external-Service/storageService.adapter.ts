import { IStorageService } from "src/core/domain/puertos/outbound/IStorageService.interface";

export class StorageServiceAdapter implements IStorageService {

    

    async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string; size: number; }): Promise<string> {
        // Aquí iría la lógica para subir el archivo a un servicio de almacenamiento (ej: AWS S3, Google Cloud Storage, etc.)
        // Por simplicidad, vamos a simular que el archivo se sube y se devuelve una URL
        const simulatedUrl = `https://storage.service.com/${file.originalname}`;
        return simulatedUrl;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        // Aquí iría la lógica para eliminar el archivo del servicio de almacenamiento
        // Por simplicidad, vamos a simular que el archivo se elimina correctamente
        console.log(`Archivo eliminado: ${fileUrl}`);
    }

}