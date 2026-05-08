import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { DataSource } from "typeorm";

export class FacturaRepositoryAdapter implements IFacturaManagerRepository {

    private readonly logger = new Logger(FacturaRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    async publishFactura(factura: FacturaModel): Promise<string> {

        this.logger.log(`Publicando factura: ${JSON.stringify(factura)}`);

        const configuredSchema = "factura";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `
        INSERT INTO ${schema}.factura 
        (${factura.assetId != "" ? "asset_id, " : ""} organizacion_id, deudor_nombre, deudor_rut, factura_numero, monto_total, fecha_vencimiento, status, correlation_id) 
        ${factura.assetId != "" ? "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)" : "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"}
        RETURNING id`;

        let values: any[] = [];
        if (factura.assetId != "") {
            values = [
                factura.assetId,
                factura.ownerUUID,
                factura.deudorNombre,
                factura.deudorRut,
                factura.facturaNumero,
                factura.montoTotal,
                factura.fechaVencimiento,
                String(factura.status),
                factura.correlationId
            ];
        } else {
            values = [
                factura.ownerUUID,
                factura.deudorNombre,
                factura.deudorRut,
                factura.facturaNumero,
                factura.montoTotal,
                factura.fechaVencimiento,
                String(factura.status),
                factura.correlationId
            ];
        }

        try {
            const result = await this.dataSource.query(query, values);
            const facturaId = result[0].id; // ✅ ID generado
            this.logger.log(`Factura creada con ID: ${facturaId}`);
            return facturaId; // o true + guardar el ID en otro lado
        } catch (error: any) {
            this.logger.error(
                `Error al publicar la factura: ${error?.message ?? error}`,
                factura.correlationId,
                error?.stack,
            );
            return error?.message ?? error;
        }
    }
}