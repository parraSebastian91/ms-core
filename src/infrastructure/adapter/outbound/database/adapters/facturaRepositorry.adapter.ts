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

    async publishFactura(factura: FacturaModel): Promise<boolean | string> {

        this.logger.log(`Publicando factura: ${JSON.stringify(factura)}`);

        const configuredSchema = "factura";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `
        INSERT INTO ${schema}.factura 
        (${factura.assetId != "" ? "asset_id, " : ""} organizacion_id, deudor_nombre, deudor_rut, factura_numero, monto_total, fecha_vencimiento, status) 
        ${factura.assetId != "" ? "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)" : "VALUES ($1, $2, $3, $4, $5, $6, $7)"}
        `;

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
                //factura.correlationId
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
                //factura.correlationId
            ];
        }

        try {
            await this.dataSource.query(query, values);
            this.logger.log(`Factura publicada exitosamente: ${factura.facturaNumero}`);
            return true;
        } catch (error: any) {
            this.logger.error(
                `Error al publicar la factura: ${error?.message ?? error}`,
                factura.correlationId,
                error?.stack,
            );
            return false;
        }
    }
}