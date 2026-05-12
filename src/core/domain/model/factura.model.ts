import { facturaEstado } from "./constantes.model";

export class FacturaModel {
    assetId: string;
    ownerUUID: string;
    gestor: string;
    nombre_mandante: string;
    rut_mandante: string;
    deudorNombre: string;
    deudorRut: string;
    facturaNumero: string;
    montoTotal: number;
    fechaVencimiento: Date;
    status: facturaEstado;
    correlationId: string;

    constructor(ownerUUID: string, gestor: string, status: facturaEstado, correlationId: string) {
        this.assetId = "";
        this.ownerUUID = ownerUUID;
        this.gestor = gestor;
        this.nombre_mandante = "";
        this.rut_mandante = "";
        this.deudorNombre = "";
        this.deudorRut = "";
        this.facturaNumero = "";
        this.montoTotal = 0;
        this.fechaVencimiento = new Date();
        this.status = status;
        this.correlationId = correlationId;
    }

    static fromEntity(entity: any): FacturaModel {
        const factura = new FacturaModel(
            entity.organizacion_id,
            entity.gestor,
            entity.status,
            entity.correlation_id
        );
        factura.assetId = entity.asset_id;
        factura.deudorNombre = entity.deudor_nombre;
        factura.rut_mandante = entity.rut_mandante;
        factura.nombre_mandante = entity.nombre_mandante;
        factura.deudorRut = entity.deudor_rut;
        factura.facturaNumero = entity.factura_numero;
        factura.montoTotal = entity.monto_total;
        factura.fechaVencimiento = new Date(entity.fecha_vencimiento);
        return factura;
    }

}

