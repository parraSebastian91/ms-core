export class FacturaDTO {
    assetId: string;
    facturaUUID?: string;
    deudorNombre: string;
    deudorRut: string;
    facturaNumero: string;
    montoTotal: number;
    fechaVencimiento: Date;
    status: string;
    constructor() {
        this.assetId = "";
        this.facturaUUID = "";
        this.deudorNombre = "";
        this.deudorRut = "";
        this.facturaNumero = "";
        this.montoTotal = 0;
        this.fechaVencimiento = new Date();
        this.status = "";
    }
}