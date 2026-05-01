export class FacturaModel {
    uuid: string;
    assetId: string;
    organizacionId: string;
    deudorNombre: string;
    deudorRut: string;
    facturaNumero: string;
    montoTotal: number;
    fechaVencimiento: Date;
    status: string;
}