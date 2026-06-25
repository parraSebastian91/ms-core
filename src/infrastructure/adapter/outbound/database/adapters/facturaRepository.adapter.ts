import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { facturaEstado } from "src/core/domain/model/constantes.model";
import { FacturaModel, NotaOCR } from "src/core/domain/model/factura.model";
import { CampoFactura, FacturaUpdateModel } from "src/core/domain/model/facturaUpdate.model";
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

    async getFacturas(usuario: string, orgUUID: string, filtro: string): Promise<FacturaModel[]> {
        this.logger.debug(`Obteniendo facturas para usuario: ${usuario}, organización: ${orgUUID}`);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario);
        let query = ``;
        let params: any[] = [];

        switch (filtro) {
            case 'xorganizacion':
                query += `SELECT * FROM permisos.obtener_facturas_accesibles($1,$2) WHERE cedente_org_id = $3 and created_at > '2026-06-25 01:00:00'::timestamp`;
                params = [usuario, orgUUID, orgUUID];
                break;
            default:
                query = `SELECT * FROM permisos.obtener_facturas_accesibles($1) where created_at > '2026-06-25 01:00:00'::timestamp`
                params = [usuario];
                break;
        }

        try {
            const result = await this.dataSource.query(query, params);
            const facturas: FacturaModel[] = result.map((row: any) => FacturaModel.fromEntity(row)) || [];

            if (facturas.length > 0) {
                const facturaIds = facturas.map(f => f.publiInvoiceId).filter(Boolean);
                const notasMap = await this.fetchNotasForFacturas(facturaIds);
                facturas.forEach(f => { f.notas = notasMap.get(f.publiInvoiceId) ?? []; });
            }

            return facturas;
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
        const query = `
            SELECT
                *
            FROM permisos.vw_facturas_publicadas_ofertadas_base f
            WHERE f.factura_id = $1
            LIMIT 1
        `;
        try {
            const result = await this.dataSource.query(query, [facturaID]);
            if (!result.length) return null;
            return FacturaModel.fromEntity(result[0]);
        } catch (error: any) {
            this.logger.error(
                `Error al obtener factura por ID: ${error?.message ?? error}`,
                `facturaID: ${facturaID}`,
                error?.stack,
            );
            return null;
        }
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
            // const result = await this.dataSource.query(query, [facturaID]);            
            // return result[0]?.is_editable || false;
            return true; // Temporalmente devolvemos true para permitir la edición, reemplaza esto con la lógica real una vez que implementes la consulta
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

    async fetchNotasForFacturas(facturaIds: string[]): Promise<Map<string, string[]>> {
        const map = new Map<string, string[]>();
        if (!facturaIds.length) return map;
        const placeholders = facturaIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `
            SELECT factura_id::text, nota
            FROM   factura.notas_ocr
            WHERE  factura_id IN (${placeholders})
              AND  resuelto = false
            ORDER BY created_at ASC
        `;
        try {
            const rows: Array<{ factura_id: string; nota: string }> =
                await this.dataSource.query(query, facturaIds);
            for (const row of rows) {
                const existing = map.get(row.factura_id) ?? [];
                existing.push(row.nota);
                map.set(row.factura_id, existing);
            }
        } catch (error: any) {
            this.logger.error(
                `Error al obtener notas OCR: ${error?.message ?? error}`,
                error?.stack,
            );
        }
        return map;
    }

    async guardarNotasOCR(facturaId: string, notas: NotaOCR[]): Promise<void> {
        if (!notas.length) return;
        const values = notas
            .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
            .join(',');
        const params: any[] = notas.flatMap(n => [
            facturaId,
            n.campo,
            n.valor_declarado,
            n.valor_ocr,
        ]);
        // campo + nota separate column: insert nota text as well
        const query = `
            INSERT INTO factura.notas_ocr (factura_id, campo, valor_declarado, valor_ocr, nota)
            VALUES ${notas.map((_, i) => {
            const base = i * 5 + 1;
            return `($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        }).join(',')}
        `;
        const fullParams: any[] = notas.flatMap(n => [
            facturaId,
            n.campo,
            n.valor_declarado,
            n.valor_ocr,
            n.nota,
        ]);
        try {
            await this.dataSource.query(query, fullParams);
            this.logger.log(`[OK] guardarNotasOCR | facturaId=${facturaId} | notas=${notas.length}`);
        } catch (error: any) {
            this.logger.error(
                `Error al guardar notas OCR: ${error?.message ?? error}`,
                `facturaId: ${facturaId}`,
                error?.stack,
            );
            throw error;
        }
    }

    async updateNotasOCRResueltas(facturaId: string, campo: CampoFactura): Promise<void> {
        const query = `
        UPDATE 
            factura.notas_ocr n
        SET resuelto=$1
        WHERE
        n.factura_id = $2
        and n.campo = $3
        `;
        try {
            await this.dataSource.query(query, [true, facturaId, campo]);
        } catch (error: any) {
            this.logger.error(
                `Error al actualizar notas OCR resueltas | facturaId=${facturaId}: ${error?.message ?? error}`,
                error?.stack
            );
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