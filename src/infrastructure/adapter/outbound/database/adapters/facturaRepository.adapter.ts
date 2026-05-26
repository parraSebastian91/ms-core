import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { facturaEstado } from "src/core/domain/model/constantes.model";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { FacturaUpdateModel } from "src/core/domain/model/facturaUpdate.model";
import { IFacturaManagerRepository } from "src/core/domain/puertos/outbound/IFacturaManager.repository";
import { AutorizacionPublicacionPayload, VersionTerminosRecord } from "src/core/domain/puertos/inbound/IFacturaPublisher.interface";
import { DataSource, QueryRunner } from "typeorm";

export class FacturaRepositoryAdapter implements IFacturaManagerRepository {

    private readonly logger = new Logger(FacturaRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    private extractUuid(value: unknown): string | null {
        if (typeof value !== 'string') {
            return null;
        }
        const candidate = value.trim();
        return this.uuidRegex.test(candidate) ? candidate : null;
    }

    private async runWithAuditContext<T>(
        userUuid: string | null,
        correlationId: string | null,
        operation: (queryRunner: QueryRunner) => Promise<T>
    ): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (userUuid) {
                await queryRunner.query(`SELECT set_config('app.user_uuid', $1, true)`, [userUuid]);
            }
            if (correlationId) {
                await queryRunner.query(`SELECT set_config('app.correlation_id', $1, true)`, [correlationId]);
            }

            const result = await operation(queryRunner);
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    async publishFactura(factura: FacturaModel): Promise<string> {

        this.logger.debug(`Publicando factura: ${JSON.stringify(factura)}`);

        const configuredSchema = "factura";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `
        INSERT INTO ${schema}.factura 
        (${factura.assetId != "" ? "asset_id, " : ""} organizacion_id, deudor_nombre, deudor_rut, factura_numero, monto_total, fecha_vencimiento, status, correlation_id, gestor_usuario_uuid) 
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
                factura.gestor.uuid ? factura.gestor.uuid : factura.gestor
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
                factura.gestor.uuid ? factura.gestor.uuid : factura.gestor
            ];
        }

        try {
            const gestorUuid = this.extractUuid(typeof factura.gestor === 'string' ? factura.gestor : factura.gestor?.uuid);
            const correlationId = this.extractUuid(factura.correlationId);
            const result = await this.runWithAuditContext(gestorUuid, correlationId, async (queryRunner) => {
                return queryRunner.query(query, values);
            });
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
            org.razon_social    AS nombre_mandante,
            org.rut             AS rut_mandante,
            fct.asset_id,
            usr.userName AS gestor,
            fct.gestor_usuario_uuid  AS gestor_uuid, 
            fct.deudor_nombre,
            fct.deudor_rut,
            fct.factura_numero,
            fct.monto_total,
            fct.fecha_vencimiento,
            fct.status,
            fct.correlation_id,
            fct.created_at,
            COUNT(ofer.factura_id)  AS ofertas,
            fct.status
        FROM factura.factura fct
        JOIN core.usuario usr
            ON usr.usuario_uuid = fct.gestor_usuario_uuid
        JOIN core.organizacion org
            ON org.organizacion_uuid = fct.organizacion_id
        LEFT JOIN factura.ofertas ofer       -- LEFT para incluir facturas sin ofertas
            ON ofer.factura_id = fct.id
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
                    ${isUUID ? 'u.usuario_uuid' : 'u.userName'} = $${params.length}
                    AND u.activo           = true
                    AND gt.activo          = true
                    AND gt.organizacion_id = fct.organizacion_id
            )
        `;
        } else {
            params.push(usuario);
            query += ` AND fct.gestor_usuario_uuid = $${params.length}`;
        }

        query += `
        GROUP BY
            fct.id,
            fct.organizacion_id,
            org.razon_social,            
            usr.userName,
            org.rut,
            fct.asset_id,
            fct.gestor_usuario_uuid,
            fct.deudor_nombre,
            fct.deudor_rut,
            fct.factura_numero,
            fct.monto_total,
            fct.fecha_vencimiento,
            fct.status,
            fct.correlation_id,
            fct.created_at
        ORDER BY fct.created_at DESC;
        `;

        try {
            const result = await this.dataSource.query(query, params);
            this.logger.debug(`Facturas obtenidas: ${JSON.stringify(result)}`);
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

    async getFacturaByID(facturaID: string): Promise<FacturaModel | null> {
        return null; // Implementa esta función si es necesario para tu caso de uso
    }

    async validateFacturaEditable(facturaID: string): Promise<boolean> {
        const query = `
        select count(*) > 0 is_editable
        from factura.factura fct
        where 
        fct.id = $1
        and fct.status in ('PENDIENTE_VALIDACION','PENDIENTE_AUTORIZACION','RECHAZADA')
        `;

        try {
            const result = await this.dataSource.query(query, [facturaID]);
            console.log("Resultado de validación de factura editable:", result);
            return result[0]?.is_editable || false;
        } catch (error: any) {
            this.logger.error(
                `Error al validar si la factura es editable: ${error?.message ?? error}`,
                `facturaID: ${facturaID}`,
                error?.stack,
            );
            return false;
        }
    }

    async updateFactura(factura: FacturaUpdateModel): Promise<{ id: string, valor: any, isUpdate: any, mensaje: string } | null> {
        const isDate = factura.campoEditado.nombre.includes("fecha");
        const valorParametrizado = isDate
            ? new Date(factura.campoEditado.valor).toISOString()
            : factura.campoEditado.valor;
        const query = `
        UPDATE 
            factura.factura 
        SET 
            ${factura.campoEditado.nombreColumna}=$4
        WHERE id=$1 and gestor_usuario_uuid=$2 and organizacion_id=$3
        RETURNING id
        `;
        try {
            const gestorUuid = this.extractUuid(factura.gestor);
            const result = await this.runWithAuditContext(gestorUuid, null, async (queryRunner) => {
                const correlationRows = await queryRunner.query(
                    `SELECT correlation_id FROM factura.factura WHERE id = $1 LIMIT 1`,
                    [factura.id]
                );

                const correlationId = this.extractUuid(correlationRows?.[0]?.correlation_id);
                if (correlationId) {
                    await queryRunner.query(`SELECT set_config('app.correlation_id', $1, true)`, [correlationId]);
                }

                return queryRunner.query(query, [factura.id, factura.gestor, factura.ownerUUID, valorParametrizado]);
            });
            if (result.length > 0) {
                return { id: factura.id, valor: factura.campoEditado.valor, isUpdate: true, mensaje: "Factura actualizada exitosamente" };
            } else {
                this.logger.warn(`No se pudo actualizar la factura, verifica que el ID sea correcto, facturaID: ${factura.id}`);
                return { id: factura.id, valor: factura.campoEditado.valor, isUpdate: false, mensaje: "No se pudo actualizar la factura, verifica que el ID sea correcto y que la factura esté en estado PENDIENTE_VALIDACION" };
            }
        } catch (error: any) {
            this.logger.error(
                `Error al actualizar la factura: ${error?.message ?? error}`,
                `facturaID: ${factura.id}`,
                error?.stack,
            );
            return { id: factura.id, valor: factura.campoEditado.valor, isUpdate: null, mensaje: "Error al actualizar la factura" };
        }
    }

    async facturaExiste(facturaId: string, facturaNumero: string, owner: string): Promise<boolean> {
        const query = `
        SELECT COUNT(*) > 0 AS existe
        FROM factura.factura fct
        WHERE 
        ${facturaId !== '' ?
                'fct.id = $1 AND fct.organizacion_id = $2 AND fct.factura_numero = $3;' :
                'fct.organizacion_id = $1 AND fct.factura_numero = $2;'}`;

        const params = facturaId !== '' ? [facturaId, owner, facturaNumero] : [owner, facturaNumero];

        try {
            const result = await this.dataSource.query(query, params);
            return result[0]?.existe || false;
        } catch (error: any) {
            this.logger.error(
                `Error al verificar si la factura existe: ${error?.message ?? error}`,
                `facturaID: ${facturaId}, owner: ${owner}`,
                error?.stack,
            );
            return false;
        }
    }

    async updateFacturaState(factura: FacturaModel, status: facturaEstado): Promise<{ id: string, valor: any, isUpdate: any, mensaje: string }> {
        const query = `
        UPDATE 
            factura.factura 
        SET 
            status=$2
        WHERE id=$1 
         ${factura.ownerUUID ? 'AND organizacion_id=$3' : ''}
        RETURNING id
        `;
        const params = factura.ownerUUID ? [factura.publiInvoiceId, String(status), factura.ownerUUID] : [factura.publiInvoiceId, String(status)];
        try {
            const gestorUuid = this.extractUuid(typeof factura.gestor === 'string' ? factura.gestor : factura.gestor?.uuid);
            const correlationId = this.extractUuid(factura.correlationId);
            const result = await this.runWithAuditContext(gestorUuid, correlationId, async (queryRunner) => {
                return queryRunner.query(query, params);
            });
            if (result.length > 0) {
                return { id: factura.publiInvoiceId, valor: status, isUpdate: true, mensaje: "Estado de la factura actualizado exitosamente" };
            } else {
                this.logger.warn(`No se pudo actualizar el estado de la factura, verifica que el ID sea correcto y que la factura exista, facturaID: ${factura.publiInvoiceId}`);
                return { id: factura.publiInvoiceId, valor: factura.status, isUpdate: false, mensaje: "No se pudo actualizar el estado de la factura" };
            }
        } catch (error: any) {
            this.logger.error(
                `Error al actualizar el estado de la factura: ${error?.message ?? error}`,
                `facturaID: ${factura.publiInvoiceId}`,
                error?.stack,
            );
            return { id: factura.publiInvoiceId, valor: factura.status, isUpdate: null, mensaje: "Error al actualizar el estado de la factura" };
        }
    }

    async getFacturaKey(facturaID: string[]): Promise<{ id: string, keyUrl: string }[] | null> {
        const query = ` select 
                            fct.id as facturar_id,
                            mv.url_path 
                        from factura.factura fct 
                            join media.media_assets ma 
                                on ma.id = fct.asset_id 
                            join media.media_variants mv 
                                on ma.id = mv.asset_id
                        where 
                            fct.id in (${facturaID.map((_, index) => `$${index + 1}`).join(',')}) 
                    `;
        try {
            const result = await this.dataSource.query(query, facturaID);
            return result.map((row: any) => ({ id: row.facturar_id, keyUrl: row.url_path }));
        } catch (error: any) {
            this.logger.error(
                `Error al obtener las claves de las facturas: ${error?.message ?? error}`,
                `facturaIDs: ${facturaID.join(', ')}`,
                error?.stack,
            );
            return null;
        }
    }

    async getVersionTerminosActiva(): Promise<VersionTerminosRecord> {
        const query = `
            SELECT id, codigo, descripcion, texto_completo, hash_sha256
            FROM factura.version_terminos
            WHERE activo = TRUE
            LIMIT 1
        `;
        try {
            const result = await this.dataSource.query(query);
            if (!result.length) {
                throw new Error('No hay versión de términos activa');
            }
            return result[0] as VersionTerminosRecord;
        } catch (error: any) {
            this.logger.error(`Error al obtener versión de términos activa: ${error?.message ?? error}`, error?.stack);
            throw error;
        }
    }

    async registrarAutorizacion(payload: AutorizacionPublicacionPayload): Promise<void> {
        const facturaResult = await this.dataSource.query(
            `SELECT organizacion_id FROM factura.factura WHERE id = $1`,
            [payload.facturaId]
        );
        if (!facturaResult.length) {
            throw new Error(`Factura ${payload.facturaId} no encontrada`);
        }
        const organizacionId = facturaResult[0].organizacion_id;

        const query = `
            INSERT INTO factura.autorizacion_publicacion
                (factura_id, usuario_uuid, organizacion_id, version_terminos_id, acepto, ip_address, user_agent, correlation_id)
            VALUES ($1, $2, $3, $4, $5, $6::inet, $7, $8)
        `;
        try {
            await this.dataSource.query(query, [
                payload.facturaId,
                payload.usuarioUUID,
                organizacionId,
                payload.versionTerminosId,
                payload.acepto,
                payload.ipAddress,
                payload.userAgent,
                payload.correlationId,
            ]);
        } catch (error: any) {
            this.logger.error(
                `Error al registrar autorización | facturaId=${payload.facturaId} | usuarioUUID=${payload.usuarioUUID}: ${error?.message ?? error}`,
                error?.stack
            );
            throw error;
        }
    }

}