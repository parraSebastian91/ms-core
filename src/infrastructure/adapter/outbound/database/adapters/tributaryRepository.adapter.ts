
import { GiroComercialModel } from "src/core/domain/model/organizacion.model";
import { ITributaryRepository } from "src/core/domain/puertos/outbound/ITributary.repostiroy";
import { PermisosRepositoryAdapter } from "./permisosManagerRepository.adapter";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { Logger } from "@nestjs/common";

export class TributaryRepositoryAdapter implements ITributaryRepository {
    private readonly logger = new Logger(TributaryRepositoryAdapter.name);
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    async insertGiroComercial(giro: GiroComercialModel): Promise<Record<string, any> | null> {
        const sql = `INSERT INTO giro_comercial (fuente, codigo, descripcion, categoria_tributaria, afecto_iva, fecha_inicio, es_principal, activo, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`
        const values = [
            giro.fuente,
            giro.codigo,
            giro.descripcion,
            giro.categoriaTributaria ?? null,
            giro.afectoIva ?? null,
            giro.fechaInicio ? giro.fechaInicio.toISOString() : null,
            giro.esPrincipal ?? null,
            true, // activo
            new Date().toISOString(), // created_at
        ];
        try {
            await this.dataSource.query(sql, values);
            this.logger.debug(`Giro comercial insertado: ${giro.codigo} - ${giro.descripcion}`);
        } catch (error) {
            this.logger.error("Error insertando giro comercial:", error);
        }                   
        return null; // Retorna el registro insertado o null si hubo un error
    }
} 