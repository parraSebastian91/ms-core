export class PublishFacturaDto {
    assetId: string;
    RutOrganizacion: string;
    deudorNombre: string;
    deudorRut: string;
    facturaNumero: string;
    montoTotal: number;
    fechaVencimiento: Date;
}