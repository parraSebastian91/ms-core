import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"
import { facturaEstado, RESOURCE_TYPE } from "src/core/domain/model/constantes.model"
import { FacturaModel } from "src/core/domain/model/factura.model"


/**
 * Un dato de la factura junto con de dónde salió.
 *
 * El worker dejó de mandar listas de candidatos del OCR y pasó a mandar un valor
 * por campo con su procedencia: `TimbreVerificado` es el timbre firmado del SII
 * y es prueba; `CapaDeTexto` es el texto incorporado del PDF, exacto pero sin
 * firmar; `Ocr` es una conjetura. Guardar el valor sin el origen volvería a
 * mezclar una prueba con una conjetura.
 */
export class CampoExtraido {
    @IsString()
    valor: string;

    @IsString()
    origen: string;
}

/**
 * Lo que el worker logró leer del documento.
 *
 * Todos los campos son opcionales a propósito: un respaldo puede ser una foto
 * sin timbre ni capa de texto, y entonces no hay nada que declarar. Antes esto
 * eran cuatro arreglos obligatorios de candidatos del OCR y `toModel` los unía
 * con `;` — o sea que una factura con tres números detectados guardaba
 * "123;456;789" como número de factura.
 */
export class NotifyPayload {
    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    folio?: CampoExtraido;

    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    rut_emisor?: CampoExtraido;

    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    rut_deudor?: CampoExtraido;

    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    razon_social_deudor?: CampoExtraido;

    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    monto_total?: CampoExtraido;

    @IsOptional()
    @ValidateNested()
    @Type(() => CampoExtraido)
    fecha_emision?: CampoExtraido;

    @IsOptional()
    tipo_dte?: number;

    @IsOptional()
    es_cedible?: boolean;

    @IsOptional()
    verificacion?: string;

    /**
     * Campos donde el timbre firmado y la capa de texto dicen cosas distintas.
     *
     * Vacío es lo normal. Si trae algo, el documento merece una mirada humana:
     * superponerle una capa de texto a la imagen de una factura real es trivial,
     * y es la única señal que lo delata.
     */
    @IsOptional()
    @IsArray()
    discrepancias?: { campo: string; segun_timbre: string; segun_texto: string }[];
}


export class NotifyModel {

    @IsString()
    @IsNotEmpty()
    resource_type: RESOURCE_TYPE;

    @IsString()
    resource_id: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    status: string;

    @IsString()
    timestamp: string;

    @IsUUID()
    correlationId: string;

    @IsUUID()
    ownerUUID: string;

    @IsString()
    gestor: string;

    @IsString()
    app: string;

    /** Null cuando el documento no dio nada por ninguna capa. */
    @IsOptional()
    @ValidateNested()
    @Type(() => NotifyPayload)
    payload?: NotifyPayload | null;

    @IsString()
    asset_id: string;

    static toModel(data: NotifyModel): FacturaModel {
        const factura = new FacturaModel(data.ownerUUID, { username: data.gestor, uuid: data.gestor }, facturaEstado.PROCESANDO, data.correlationId);
        factura.publiInvoiceId = data.resource_id;
        factura.correlationId = data.correlationId;
        factura.assetId = data.asset_id;

        // Sin payload la factura queda registrada igual, vacía y en PROCESANDO:
        // el documento se subió bien, lo que falló fue leerlo. Perder el
        // registro dejaría un archivo huérfano en el bucket.
        const p = data.payload;
        if (!p) {
            return factura;
        }

        factura.facturaNumero = p.folio?.valor ?? '';
        factura.deudorRut = p.rut_deudor?.valor ?? '';
        factura.deudorNombre = p.razon_social_deudor?.valor ?? '';
        factura.montoTotal = Number(p.monto_total?.valor ?? 0);
        return factura;
    }
}
