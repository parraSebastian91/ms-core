import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    BancoRow,
    ComunaRow,
    ICatalogoRepository,
    ProductoFinancieroRow,
    ProvinciaRow,
    RegionRow,
} from 'src/core/domain/puertos/outbound/ICatalogo.repository';

export class CatalogoRepositoryAdapter implements ICatalogoRepository {

    private readonly logger = new Logger(CatalogoRepositoryAdapter.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async getRegiones(paisCodigo: string): Promise<RegionRow[]> {
        try {
            return await this.dataSource.query(
                `SELECT id, codigo, nombre, tipo, pais_codigo, pais_nombre
                 FROM core.v_geo_regiones
                 WHERE pais_codigo = $1`,
                [paisCodigo.toUpperCase()],
            );
        } catch (error: any) {
            this.logger.error(`Error getRegiones pais=${paisCodigo}: ${error?.message}`);
            return [];
        }
    }

    async getProvincias(regionId: number): Promise<ProvinciaRow[]> {
        try {
            return await this.dataSource.query(
                `SELECT id, codigo, nombre, tipo, region_id, region_nombre, pais_codigo
                 FROM core.v_geo_provincias
                 WHERE region_id = $1`,
                [regionId],
            );
        } catch (error: any) {
            this.logger.error(`Error getProvincias regionId=${regionId}: ${error?.message}`);
            return [];
        }
    }

    async getComunas(provinciaId: number): Promise<ComunaRow[]> {
        try {
            return await this.dataSource.query(
                `SELECT id, codigo, nombre, tipo, provincia_id, provincia_nombre,
                        region_id, region_nombre, pais_codigo
                 FROM core.v_geo_comunas
                 WHERE provincia_id = $1`,
                [provinciaId],
            );
        } catch (error: any) {
            this.logger.error(`Error getComunas provinciaId=${provinciaId}: ${error?.message}`);
            return [];
        }
    }

    async getBancos(paisCodigo: string): Promise<BancoRow[]> {
        try {
            return await this.dataSource.query(
                `SELECT b.banco_id AS id, b.codigo, b.nombre
                 FROM core.banco b
                 JOIN core.pais p ON p.pais_id = b.pais_id
                 WHERE p.codigo = $1 AND b.activo = true
                 ORDER BY b.nombre`,
                [paisCodigo.toUpperCase()],
            );
        } catch (error: any) {
            this.logger.error(`Error getBancos pais=${paisCodigo}: ${error?.message}`);
            return [];
        }
    }

    async getProductosFinancieros(tipoOrg?: string): Promise<ProductoFinancieroRow[]> {
        try {
            if (tipoOrg) {
                return await this.dataSource.query(
                    `SELECT producto_id AS id, codigo, nombre, descripcion, aplica_a
                     FROM core.producto_financiero
                     WHERE activo = true AND $1 = ANY(aplica_a)
                     ORDER BY nombre`,
                    [tipoOrg.toUpperCase()],
                );
            }
            return await this.dataSource.query(
                `SELECT producto_id AS id, codigo, nombre, descripcion, aplica_a
                 FROM core.producto_financiero
                 WHERE activo = true
                 ORDER BY nombre`,
            );
        } catch (error: any) {
            this.logger.error(`Error getProductosFinancieros tipoOrg=${tipoOrg}: ${error?.message}`);
            return [];
        }
    }

    async getMediaCategory(mediaType: string): Promise<{ codigo: number; nombre: string }[]> {
        try {
            return await this.dataSource.query(
                `SELECT codigo, nombre
                 FROM media.categoria c 
                 WHERE c.media_type = $1
                 ORDER BY c.nombre`,
                [mediaType.toUpperCase()],
            );
        } catch (error: any) {
            this.logger.error(`Error getMediaCategory mediaType=${mediaType}: ${error?.message}`);
            return [];
        }
    }
}
