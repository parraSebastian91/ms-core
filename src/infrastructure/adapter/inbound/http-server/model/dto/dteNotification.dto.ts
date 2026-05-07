import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from "class-validator"
import { facturaEstado } from "src/core/domain/model/constantes.model"
import { FacturaModel } from "src/core/domain/model/factura.model"


export class NotifyPayload {
    @IsArray()
    @IsString({ each: true })
    numeroFactura: string[];

    @IsArray()
    @IsString({ each: true })
    rutDeudor: string[];

    @IsArray()
    @IsString({ each: true })
    nombreDeudor: string[];

    @IsArray()
    @IsString({ each: true })
    montoTotal: string[];
}


export class NotifyModel {
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
    app: string;

    @ValidateNested()
    @Type(() => NotifyPayload)
    payload: NotifyPayload;

    static toModel(data: NotifyModel): FacturaModel {
        const factura = new FacturaModel(data.ownerUUID, facturaEstado.PENDIENTE_VALIDACION, data.correlationId);
        factura.facturaNumero = data.payload.numeroFactura.join(";");
        factura.deudorRut = data.payload.rutDeudor.join(";");
        factura.deudorNombre = data.payload.nombreDeudor.join(";");
        factura.montoTotal = parseFloat(data.payload.montoTotal.join(";"));
        factura.correlationId = data.correlationId;
        return factura;
    }
}
