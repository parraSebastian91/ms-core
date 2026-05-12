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

        this.logger.debug(`Publicando factura: ${JSON.stringify(factura)}`);

        const configuredSchema = "factura";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `
        INSERT INTO ${schema}.factura 
        (${factura.assetId != "" ? "asset_id, " : ""} organizacion_id, deudor_nombre, deudor_rut, factura_numero, monto_total, fecha_vencimiento, status, correlation_id, gestor) 
        ${factura.assetId != "" ? "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)" : "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"}
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
                factura.correlationId,
                factura.gestor
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
                factura.correlationId,
                factura.gestor
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

    async getFacturas(usuario: string, orgUUID: string, isLeader: boolean): Promise<FacturaModel[]> {
        this.logger.debug(`Obteniendo facturas para usuario: ${usuario}, organización: ${orgUUID}`);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario);
        const params: any[] = [];
        const todasLasOrgs = orgUUID === 'Todas';

        // Base
        let query = `
        SELECT
            fct.id              AS uuid,
            fct.organizacion_id AS organizacion_uuid,
            org.razon_social as nombre_mandante,
            org.rut as rut_mandante,
            fct.asset_id,
            fct.gestor,
            fct.deudor_nombre,
            fct.deudor_rut,
            fct.factura_numero,
            fct.monto_total,
            fct.fecha_vencimiento,
            fct.status,
            fct.correlation_id,
            fct.created_at,
            CASE
                when fct.status = 'PENDIENTE_VALIDACION' 
                    THEN mv.url_path       
                ELSE 'N/A'
            END AS storage_key     
            FROM factura.factura fct 
                join core.organizacion org
                    on fct.organizacion_id = org.organizacion_uuid  
                join media.media_assets ma 
                    on ma.owner_id = org.organizacion_uuid 
                    and ma.category = 'DTE-factura'
                join media.media_variants mv
                    on mv.asset_id = ma.id 
            WHERE 1=1
    `;

        // Filtro por org
        if (!todasLasOrgs) {
            params.push(orgUUID);
            query += ` AND fct.organizacion_id = $${params.length}`;
        }

        // Filtro por rol
        if (isLeader) {
            params.push(usuario);
            query += `
            AND EXISTS (
                SELECT 1
                FROM core.usuario u
                JOIN core.grupo_trabajo gt
                    ON gt.lider_usuario_uuid = u.usuario_uuid
                WHERE 
                    ${isUUID ? 'u.usuario_uuid' : 'u.username'} = $${params.length}
                    AND u.activo           = true
                    AND gt.activo          = true
                    AND gt.organizacion_id = fct.organizacion_id
            )
        `;
        } else {
            params.push(usuario);
            query += ` AND fct.gestor = $${params.length}`;
        }

        query += ` ORDER BY fct.created_at DESC`;

        try {
            const result = await this.dataSource.query(query, params);
            this.logger.debug(`Facturas obtenidas: ${JSON.stringify(result)}`);


            // Aquí deberías mapear el resultado a FacturaModel[]
            return result.map((row: any) => FacturaModel.fromEntity(row)) || [];
        } catch (error: any) {
            this.logger.error(
                `Error al obtener las facturas: ${error?.message ?? error}`,
                `usuario: ${usuario}, organización: ${orgUUID}`,
                error?.stack,
            );
        }
        return [];
    }
}