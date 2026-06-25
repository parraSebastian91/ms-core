import { createdBy, facturaEstado } from "./constantes.model";

export interface NotaOCR {
    campo: string;
    valor_declarado: string;
    valor_ocr: string;
    nota: string;
}

export class Row {
    factura_id: string;
    cedente_org_id: string;
    cedente_razon_social: string;
    cedente_rut: string;
    deudor_nombre: string;
    deudor_rut: string;
    factura_numero: string;
    monto_total: string;
    fecha_vencimiento: Date;
    factura_status: facturaEstado;
    created_at: Date;
    updated_at: Date;
    total_ofertas: number;
    ofertas_enviadas: number;
    ofertas_revisadas: number;
    ofertas_aceptadas: number;
    ofertas_rechazadas: number;
    mejor_tasa: number;
    mejor_monto_oferta: number;
    ultima_actualizacion_oferta: Date;
    esta_ofertada: boolean;
    tiene_permiso: boolean;
    org_contexto_uuid: string;
    url_factura: string | null;
    gestor_uuid: string;
    gestor_username: string;
    correlation_id: string;
    asset_id: string;
    created_by: createdBy;
    adjuntos: Adjunto[];
    notas?: string[];
}

export class Adjunto {
    id: string;
    tipo: string;
    orden: number;
    asset_id: string;
    url_path: string;
    descripcion: string;
    es_principal: boolean;
}

export class FacturaModel {
    publiInvoiceId: string;
    assetId: string;
    ownerUUID: string; // cedente_org_id
    gestor: {
        uuid: string;
        username: string;
    };
    nombre_cliente_cedente: string; // deudor_nombre
    rut_cliente_cedente: string; // deudor_rut
    deudorNombre: string;
    deudorRut: string;
    facturaNumero: string;
    montoTotal: number;
    fechaVencimiento: Date;
    status: facturaEstado;
    correlationId: string;
    total_ofertas: number;
    ofertas_enviadas: number;
    ofertas_revisadas: number;
    ofertas_aceptadas: number;
    ofertas_rechazadas: number;
    mejor_tasa: number;
    mejor_monto_oferta: number;
    ultima_actualizacion_oferta: Date | null;
    esta_ofertada: boolean;
    tiene_permiso: boolean;
    org_contexto_uuid: string;
    created_at: Date;
    updated_at: Date;
    url_factura: string | null;
    createdBy: createdBy;
    notas?: string[];
    adjuntos?: Adjunto[];
    constructor(ownerUUID: string, gestor: { uuid: string, username: string }, status: facturaEstado, correlationId: string) {
        this.assetId = "";
        this.ownerUUID = ownerUUID;
        this.gestor = gestor;
        this.nombre_cliente_cedente = "";
        this.rut_cliente_cedente = "";
        this.deudorNombre = "";
        this.deudorRut = "";
        this.facturaNumero = "";
        this.montoTotal = 0;
        this.fechaVencimiento = new Date();
        this.status = status;
        this.correlationId = correlationId;
        this.total_ofertas = 0;
        this.ofertas_enviadas = 0;
        this.ofertas_revisadas = 0;
        this.ofertas_aceptadas = 0;
        this.ofertas_rechazadas = 0;
        this.mejor_tasa = 0;
        this.mejor_monto_oferta = 0;
        this.ultima_actualizacion_oferta = null;
        this.esta_ofertada = false;
        this.tiene_permiso = false;
        this.org_contexto_uuid = "";
        this.created_at = new Date();
        this.updated_at = new Date();
        this.url_factura = null;
        this.createdBy = createdBy.FORM;
    }

    static fromEntity(entity: Row): FacturaModel {
        const factura = new FacturaModel(
            entity.cedente_org_id,
            {
                uuid: entity.gestor_uuid,
                username: entity.gestor_username
            },
            entity.factura_status as facturaEstado,
            entity.correlation_id
        );
        factura.publiInvoiceId = entity.factura_id;
        factura.assetId = entity.asset_id || "";
        factura.deudorNombre = entity.deudor_nombre;
        factura.rut_cliente_cedente = entity.cedente_rut;
        factura.nombre_cliente_cedente = entity.cedente_razon_social;
        factura.deudorRut = entity.deudor_rut;
        factura.facturaNumero = entity.factura_numero;
        factura.montoTotal = Number(entity.monto_total.replace(/\./g, '')); // Eliminar puntos antes de convertir a número
        factura.fechaVencimiento = new Date(entity.fecha_vencimiento);
        factura.total_ofertas = entity.total_ofertas || 0;
        factura.ofertas_enviadas = entity.ofertas_enviadas || 0;
        factura.ofertas_revisadas = entity.ofertas_revisadas || 0;
        factura.ofertas_aceptadas = entity.ofertas_aceptadas || 0;
        factura.ofertas_rechazadas = entity.ofertas_rechazadas || 0;
        factura.mejor_tasa = entity.mejor_tasa || 0;
        factura.mejor_monto_oferta = entity.mejor_monto_oferta || 0;
        factura.ultima_actualizacion_oferta = entity.ultima_actualizacion_oferta ? new Date(entity.ultima_actualizacion_oferta) : null;
        factura.esta_ofertada = entity.esta_ofertada || false;
        factura.tiene_permiso = entity.tiene_permiso || false;
        factura.org_contexto_uuid = entity.org_contexto_uuid || "";
        factura.created_at = entity.created_at;
        factura.updated_at = entity.updated_at;
        factura.url_factura = entity.url_factura;
        factura.createdBy = entity.created_by as createdBy;
        if (entity.notas) {
            factura.notas = entity.notas;
        }
        if (entity.adjuntos) {
            factura.adjuntos = entity.adjuntos
                .filter((adjunto: Adjunto) => adjunto ?? false)
                .map((adjunto: any) => ({
                    id: adjunto.id,
                    tipo: adjunto.tipo,
                    orden: adjunto.orden,
                    asset_id: adjunto.asset_id,
                    url_path: adjunto.url_path,
                    descripcion: adjunto.descripcion,
                    es_principal: adjunto.es_principal
                }));
        }
        return factura;
    }

}

