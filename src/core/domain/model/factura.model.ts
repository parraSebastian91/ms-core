import { facturaEstado } from "./constantes.model";

export class FacturaModel {
    assetId: string;
    ownerUUID: string;
    gestor: string;
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
        this.deudorNombre = "";
        this.deudorRut = "";
        this.facturaNumero = "";
        this.montoTotal = 0;
        this.fechaVencimiento = new Date();
        this.status = status;
        this.correlationId = correlationId;
    }
}

