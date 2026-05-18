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
    constructor(facturaId: string, ownerUUID: string, numeroFactura: string, rutDeudor: string, nombreDeudor: string, correlationId: string, montoTotal: number, fechaVencimiento: Date, gestor: { uuid: string, username: string }) {
        this.facturaId = facturaId;
        this.ownerUUID = ownerUUID;
        this.numeroFactura = numeroFactura;
        this.rutDeudor = rutDeudor;
        this.nombreDeudor = nombreDeudor;
        this.correlationId = correlationId;
        this.montoTotal = montoTotal;
        this.fechaVencimiento = fechaVencimiento;
        this.gestor = gestor;
    }

    static toModel(dto: FacturaCreateRequestDto): FacturaModel {
        const factura = new FacturaModel(
            dto.ownerUUID,
            dto.gestor,
            facturaEstado.PUBLICADA, // Asumiendo que el estado inicial es PUBLICADA (puedes ajustar esto según tus necesidades)
            dto.correlationId // CorrelationId desde el DTO
        );
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