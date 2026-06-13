export interface RegionRow {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    pais_codigo: string;
    pais_nombre: string;
}

export interface ProvinciaRow {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    region_id: number;
    region_nombre: string;
    pais_codigo: string;
}

export interface ComunaRow {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    provincia_id: number;
    provincia_nombre: string;
    region_id: number;
    region_nombre: string;
    pais_codigo: string;
}

export interface BancoRow {
    id: number;
    codigo: string;
    nombre: string;
}

export interface ProductoFinancieroRow {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    aplica_a: string[];
}

export const CATALOGO_REPOSITORY = 'CATALOGO_REPOSITORY';

export interface ICatalogoRepository {
    getRegiones(paisCodigo: string): Promise<RegionRow[]>;
    getProvincias(regionId: number): Promise<ProvinciaRow[]>;
    getComunas(provinciaId: number): Promise<ComunaRow[]>;
    getBancos(paisCodigo: string): Promise<BancoRow[]>;
    getProductosFinancieros(tipoOrg?: string): Promise<ProductoFinancieroRow[]>;
    getMediaCategory(mediaType: string): Promise<{ codigo: number; nombre: string }[]>;
}
