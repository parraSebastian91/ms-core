import { facturaEstado } from "src/core/domain/model/constantes.model";
import { FacturaModel } from "src/core/domain/model/factura.model";

export class FacturaCreateRequestDto {
    facturaId: string;
    ownerUUID: string;
    numeroFactura: string;
    rutDeudor: string;
    nombreDeudor: string;
    correlationId: string;
    montoTotal: number;
    fechaVencimiento: Date;
    gestor: {
        uuid: string;
        username: string;
    };
    status: facturaEstado;
    constructor(facturaId: string, ownerUUID: string, numeroFactura: string, rutDeudor: string, nombreDeudor: string, correlationId: string, montoTotal: number, fechaVencimiento: Date, gestor: { uuid: string, username: string }, status: facturaEstado) {
        this.facturaId = facturaId;
        this.ownerUUID = ownerUUID;
        this.numeroFactura = numeroFactura;
        this.rutDeudor = rutDeudor;
        this.nombreDeudor = nombreDeudor;
        this.correlationId = correlationId;
        this.montoTotal = montoTotal;
        this.fechaVencimiento = fechaVencimiento;
        this.gestor = gestor;
        this.status = status;
    }

    static toModel(dto: FacturaCreateRequestDto): FacturaModel {
        const factura = new FacturaModel(
            dto.ownerUUID,
            dto.gestor,
            dto.status, // Usando el estado proporcionado en el DTO
            dto.correlationId // CorrelationId desde el DTO
        );
        factura.status = dto.status; // Asegurando que el estado se establezca correctamente
        factura.publiInvoiceId = dto.facturaId;
        factura.ownerUUID = dto.ownerUUID;
        factura.facturaNumero = dto.numeroFactura;
        factura.deudorRut = dto.rutDeudor;
        factura.deudorNombre = dto.nombreDeudor;
        factura.montoTotal = dto.montoTotal;
        factura.fechaVencimiento = dto.fechaVencimiento;
        factura.gestor = dto.gestor; // gestor llega como objeto con uuid y username
        return factura;
    }
}