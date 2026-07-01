import { FacturaModel } from '../../model/factura.model';
import { FacturaMarketplace, MarketplacePage } from '../../model/facturaMarketplace.model';

export const CACHE_PROVIDER = 'REDIS_CLIENT';

export interface IFacturaCacheRepository {
  PopulateCache(factura: FacturaModel[]): Promise<FacturaMarketplace[]>;
  getFacturaFromCache(id: string): Promise<FacturaMarketplace | null>;
  getFacturasPublicadasFromCache(
    cursor?: string,
    limit?: number,
  ): Promise<MarketplacePage>;
  setFacturaInCache(factura: FacturaModel): Promise<FacturaMarketplace>;
  deleteFacturaFromCache(
    id: string,
    ownerUUID: string,
    deudorRut: string,
  ): Promise<void>;
}
