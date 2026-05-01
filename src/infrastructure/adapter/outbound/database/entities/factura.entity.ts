export class FacturaEntity {
    factura_uuid: string;
    asset_id: string;
    organizacion_id: string;
    deudor_nombre: string;
    deudor_rut: string;
    factura_numero: string;
    monto_total: number;
    fecha_vencimiento: Date;
    status: string;
    created_at: Date;
    updated_at: Date;
}
