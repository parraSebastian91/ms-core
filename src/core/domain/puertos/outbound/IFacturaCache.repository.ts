import { FacturaModel } from '../../model/factura.model';
import { FacturaMarketplace } from '../../model/facturaMarketplace.model';

export const CACHE_PROVIDER = 'REDIS_CLIENT';

export interface IFacturaCacheRepository {
  PopulateCache(factura: FacturaModel[]): Promise<FacturaMarketplace[]>;
  getFacturaFromCache(id: string): Promise<FacturaMarketplace | null>;
  getFacturasPublicadasFromCache(
    page: number,
    limit: number,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    data: FacturaMarketplace[];
  }>;
  setFacturaInCache(factura: FacturaModel): Promise<FacturaMarketplace>;
  deleteFacturaFromCache(
    id: string,
    ownerUUID: string,
    deudorRut: string,
  ): Promise<void>;
}
