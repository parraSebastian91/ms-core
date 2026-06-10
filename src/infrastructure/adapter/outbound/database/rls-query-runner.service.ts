import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * RlsQueryRunner
 *
 * Envuelve una query o bloque de queries en una transacción que primero
 * inyecta el contexto RLS con SET LOCAL.
 *
 * SET LOCAL garantiza que las variables solo viven dentro de la transacción
 * y se limpian al hacer COMMIT/ROLLBACK — seguro con connection pool.
 *
 * Uso en repositorios:
 *
 *   constructor(private readonly rls: RlsQueryRunner) {}
 *
 *   async getMisDatos(userUuid: string, orgUuid: string) {
 *     return this.rls.run(userUuid, orgUuid, async (qr) => {
 *       return qr.query(`SELECT * FROM core.contacto`);
 *       // RLS filtra automáticamente — solo devuelve el contacto del usuario
 *     });
 *   }
 */
@Injectable()
export class RlsQueryRunner {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Ejecuta `callback` dentro de una transacción con contexto RLS inyectado.
     * @param userUuid  UUID del usuario autenticado (de request["user"].userUuid)
     * @param orgUuid   UUID de la organización activa (de request["user"].orgUuid)
     * @param callback  Función que recibe el QueryRunner activo
     */
    async run<T>(
        userUuid: string | null,
        orgUuid: string | null,
        callback: (qr: QueryRunner) => Promise<T>,
    ): Promise<T> {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            // Inyectar contexto RLS — SET LOCAL solo vive en esta transacción
            if (userUuid) {
                await qr.query(`SET LOCAL app.user_uuid = '${this.sanitizeUuid(userUuid)}'`);
            }
            if (orgUuid) {
                await qr.query(`SET LOCAL app.org_uuid = '${this.sanitizeUuid(orgUuid)}'`);
            }

            const result = await callback(qr);
            await qr.commitTransaction();
            return result;
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    /**
     * Valida que el string sea un UUID válido antes de interpolarlo.
     * Previene SQL injection en el SET LOCAL.
     */
    private sanitizeUuid(value: string): string {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            throw new Error(`Valor inválido para contexto RLS: "${value}"`);
        }
        return value;
    }
}
