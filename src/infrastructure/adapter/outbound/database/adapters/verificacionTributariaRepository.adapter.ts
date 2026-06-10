import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    GuardarVerificacionPayload,
    IVerificacionTributariaRepository,
} from 'src/core/domain/puertos/outbound/IVerificacionTributaria.repository';
import { TributaryModel } from 'src/core/domain/model/tributaryData.model';
import { GiroComercialModel } from 'src/core/domain/model/organizacion.model';

/**
 * Normaliza la respuesta cruda de cualquier organismo fiscal (SII, AFIP, etc.)
 * y persiste en core.organizacion_verificacion_tributaria +
 * core.organizacion_actividad_economica.
 *
 * El mapping de campos específicos por fuente se encapsula aquí.
 * Si se agrega AFIP, se extiende normalizar() sin tocar el resto.
 */
export class VerificacionTributariaRepositoryAdapter
    implements IVerificacionTributariaRepository {

    private readonly logger = new Logger(VerificacionTributariaRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async insertTributaryData(normalized: TributaryModel, organizacionId: number, fuente: string): Promise<{ id: number }> {

        const result = await this.dataSource.query<{ id: number }[]>(
            `INSERT INTO core.organizacion_verificacion_tributaria (
                organizacion_id,
                pais_id,
                identificador_fiscal,
                razon_social_oficial,
                fuente,
                registrado,
                activo,
                cumple_obligacion,
                primera_categoria,
                emisor_dte,
                tiene_factura_electronica,
                fecha_inicio_actividades,
                tiene_deuda_previsional,
                tiene_quiebra,
                tiene_restriccion_folios,
                tiene_alerta_grave,
                ultima_alerta_texto,
                raw_response,
                consultado_en,
                activo_registro
            )
            VALUES ($1,
                (SELECT pais_id FROM core.pais WHERE codigo = $2 LIMIT 1),
                $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18::jsonb,
                now(), true
            )
            ON CONFLICT (organizacion_id) DO UPDATE SET
                pais_id                  = EXCLUDED.pais_id,
                identificador_fiscal     = EXCLUDED.identificador_fiscal,
                razon_social_oficial     = EXCLUDED.razon_social_oficial,
                fuente                   = EXCLUDED.fuente,
                registrado               = EXCLUDED.registrado,
                activo                   = EXCLUDED.activo,
                cumple_obligacion        = EXCLUDED.cumple_obligacion,
                primera_categoria        = EXCLUDED.primera_categoria,
                emisor_dte               = EXCLUDED.emisor_dte,
                tiene_factura_electronica = EXCLUDED.tiene_factura_electronica,
                fecha_inicio_actividades = EXCLUDED.fecha_inicio_actividades,
                tiene_deuda_previsional  = EXCLUDED.tiene_deuda_previsional,
                tiene_quiebra            = EXCLUDED.tiene_quiebra,
                tiene_restriccion_folios = EXCLUDED.tiene_restriccion_folios,
                tiene_alerta_grave       = EXCLUDED.tiene_alerta_grave,
                ultima_alerta_texto      = EXCLUDED.ultima_alerta_texto,
                raw_response             = EXCLUDED.raw_response,
                consultado_en            = now(),
                activo_registro          = true,
                updated_at               = now()
            RETURNING id`,
            [
                organizacionId,
                normalized.paisCodigo,
                normalized.identificadorFiscal,
                normalized.razonSocialOficial,
                fuente,
                normalized.registrado,
                normalized.activo,
                normalized.cumpleObligacion,
                normalized.primeraCategoria,
                normalized.emisorDte,
                normalized.tieneFacturaElectronica,
                normalized.fechaInicioActividades,
                normalized.tieneDeudaPrevisional,
                normalized.tieneQuiebra,
                normalized.tieneRestriccionFolios,
                normalized.tieneAlertaGrave,
                normalized.ultimaAlertaTexto,
                JSON.stringify(normalized.rawResponse),
            ],
        );

        const id = result[0].id;
        this.logger.log(`[OK] Verificación tributaria upsert | orgId=${organizacionId} | id=${id} | fuente=${fuente}`);

        // // Sincronizar actividades económicas (reemplaza las existentes)
        // if (normalized.actividades.length > 0) {
        //     await this.dataSource.query(
        //         `DELETE FROM core.organizacion_actividad_economica
        //          WHERE organizacion_id = $1 AND fuente = $2`,
        //         [organizacionId, fuente],
        //     );

        //     for (const act of normalized.actividades) {
        //         await this.dataSource.query(
        //             `INSERT INTO core.organizacion_actividad_economica
        //                 (organizacion_id, fuente, codigo, descripcion,
        //                  categoria_tributaria, afecto_iva, fecha_inicio, es_principal)
        //              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        //             [
        //                 organizacionId,
        //                 fuente,
        //                 act.codigo,
        //                 act.descripcion,
        //                 act.categoriaTributaria,
        //                 act.afectoIva,
        //                 act.fechaInicio,
        //                 act.esPrincipal,
        //             ],
        //         );
        //     }
        //     this.logger.log(`[OK] ${normalized.actividades.length} actividades sincronizadas | orgId=${organizacionId}`);
        // }

        return { id };
    }

    async insertActividadEconomica(organizacionId: number, actividad: GiroComercialModel): Promise<void> {
        try {
            await this.dataSource.query(
                `INSERT INTO core.organizacion_actividad_economica
                    (organizacion_id, fuente, codigo, descripcion,
                        categoria_tributaria, afecto_iva, fecha_inicio, es_principal)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    organizacionId,
                    actividad.fuente, // Fuente fija para actividades provenientes de verificación tributaria
                    actividad.codigo,
                    actividad.descripcion,
                    actividad.categoriaTributaria,
                    actividad.afectoIva,
                    actividad.fechaInicio,
                    actividad.esPrincipal,
                ],
            );
            this.logger.log(`[OK] Actividades económicas insertadas | orgId=${organizacionId} | fuente=${actividad.fuente}`);
        } catch (error) {
            this.logger.error(`[ERROR] Insertando actividades económicas | orgId=${organizacionId} | fuente=${actividad.fuente} | error=${error}`);
            throw error;
        }
    }

    async deleteActividadesEconomicas(organizacionId: number, fuente: string): Promise<void> {
        try {
            await this.dataSource.query(
                `DELETE FROM core.organizacion_actividad_economica
                 WHERE organizacion_id = $1 AND fuente = $2`,
                [organizacionId, fuente],
            );
            this.logger.log(`[OK] Actividades económicas eliminadas | orgId=${organizacionId} | fuente=${fuente}`);
        } catch (error) {
            this.logger.error(`[ERROR] Eliminando actividades económicas | orgId=${organizacionId} | fuente=${fuente} | error=${error}`);
            throw error;
        }
    }

    async getVerificacionVigente(organizacionId: number): Promise<Record<string, any> | null> {
        const rows = await this.dataSource.query(
            `SELECT * FROM core.v_verificacion_tributaria_vigente WHERE organizacion_id = $1`,
            [organizacionId],
        );
        return rows?.[0] ?? null;
    }

    async upsertRaw(payload: GuardarVerificacionPayload): Promise<void> {
        await this.dataSource.query(
            `INSERT INTO core.organizacion_verificacion_tributaria
               (organizacion_id, fuente, raw_response, consultado_en, activo_registro)
             VALUES ($1, $2, $3::jsonb, now(), true)
             ON CONFLICT (organizacion_id) DO UPDATE
               SET fuente         = EXCLUDED.fuente,
                   raw_response   = EXCLUDED.raw_response,
                   consultado_en  = now(),
                   activo_registro = true,
                   updated_at     = now()`,
            [payload.organizacionId, payload.fuente, JSON.stringify(payload.rawResponse)],
        );
        this.logger.log(`[upsertRaw] orgId=${payload.organizacionId} fuente=${payload.fuente}`);
    }
}
