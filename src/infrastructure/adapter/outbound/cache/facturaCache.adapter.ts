import {
  CACHE_PROVIDER,
  IFacturaCacheRepository,
} from 'src/core/domain/puertos/outbound/IFacturaCache.repository';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { FacturaMarketplace, MarketplacePage } from 'src/core/domain/model/facturaMarketplace.model';
import { FacturaModel } from 'src/core/domain/model/factura.model';

export class FacturaCacheAdapter implements IFacturaCacheRepository {
  ttlFactura = 3600; // Tiempo de vida en caché en segundos (1 hora)

  key = {
    factura: (id: string) => `market:factura:${id}`,
    facturaIndexOwner: (orgId: string) => `market:factura:index:owner:${orgId}`,
    facturaIndexDeudor: (orgId: string) =>
      `market:factura:index:deudor:${orgId}`,
    facturaIndexPublicadas: () => `market:factura:index:publicadas`,
  };

  constructor(@Inject(CACHE_PROVIDER) private readonly redis: Redis) {
    // Inicialización del adaptador de caché, por ejemplo, conexión a Redis
  }

  async PopulateCache(facturas: FacturaModel[]): Promise<FacturaMarketplace[]> {
    const pipeline = this.redis.pipeline();
    const CHUNK_SIZE = 1000;
    const facturasMarketplace: FacturaMarketplace[] = [];

    for (let i = 0; i < facturas.length; i += CHUNK_SIZE) {
      const facturasChunk = facturas.slice(i, i + CHUNK_SIZE);
      facturasChunk.forEach((factura) => {
        const facturaKey = this.key.factura(factura.publiInvoiceId);
        const ownerKey = this.key.facturaIndexOwner(factura.ownerUUID);
        const deudorKey = this.key.facturaIndexDeudor(factura.deudorRut);
        const publicadasKey = this.key.facturaIndexPublicadas();

        const facturaData: FacturaMarketplace = {
          facturaId: factura.publiInvoiceId,
          folio: factura.facturaNumero,
          razonSocial: factura.deudorNombre,
          rutDeudor: factura.deudorRut,
          monto: factura.montoTotal,
          fechaVencimiento: factura.fechaVencimiento.toISOString(),
          diasRestantes: Math.ceil(
            (factura.fechaVencimiento.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          cantidadOfertas: factura.total_ofertas,
          tasaMinima: factura.mejor_tasa || null,
          esPreferido: false, // Este valor puede ser determinado según la lógica de negocio
          tieneOfertaPropia: false, // Este valor puede ser determinado según la lógica de negocio
          publicadoEn: factura.created_at.toISOString(),
        };
        facturasMarketplace.push(facturaData);
        pipeline.hset(facturaKey, facturaData);
        const timestamp = Date.now();
        pipeline.zadd(ownerKey, timestamp, facturaKey);
        pipeline.zadd(deudorKey, timestamp, facturaKey);
        pipeline.zadd(publicadasKey, timestamp, facturaKey);
        pipeline.expire(ownerKey, 86400);
        pipeline.expire(deudorKey, 86400);
        pipeline.expire(publicadasKey, 86400);
        pipeline.expire(facturaKey, 86400);
      });
      const resultados = await pipeline.exec();
      const error = resultados.find(([err, res]) => err !== null);
      if (error) {
        console.error(
          'Hubo un problema al poblar algunos registros en la caché',
          error[0],
        );
      } else {
        console.log('¡Caché calentada exitosamente en milisegundos planos!');
      }
    }
    return facturasMarketplace;
  }

  async getFacturaFromCache(id: string): Promise<FacturaMarketplace | null> {
    const key = this.key.factura(id);
    const data = await this.redis.hgetall(key);
    if (Object.keys(data).length === 0) return null;

    return {
      facturaId: data.facturaId,
      folio: data.folio,
      razonSocial: data.razonSocial,
      rutDeudor: data.rutDeudor,
      monto: parseFloat(data.monto),
      fechaVencimiento: data.fechaVencimiento,
      diasRestantes: parseInt(data.diasRestantes, 10),
      cantidadOfertas: parseInt(data.cantidadOfertas, 10),
      tasaMinima: data.tasaMinima ? parseFloat(data.tasaMinima) : null,
      esPreferido: data.esPreferido === 'true',
      tieneOfertaPropia: data.tieneOfertaPropia === 'true',
      publicadoEn: data.publicadoEn,
    };
  }

  async getFacturasPublicadasFromCache(
    cursor?: string,
    limit: number = 20,
  ): Promise<MarketplacePage> {
    const MIN_DIAS_ALTA_LIQUIDEZ = 30;
    const pageSize = Math.min(limit ?? 20, 100);

    // El cursor es el offset codificado en base64 para evitar exposición de internos
    const offset = cursor
      ? parseInt(Buffer.from(cursor, 'base64').toString('utf8'), 10) || 0
      : 0;

    const publicadasKey = this.key.facturaIndexPublicadas();
    const facturaKeys = await this.redis.zrange(
      publicadasKey,
      offset,
      offset + pageSize - 1,
      'REV',
    );

    if (facturaKeys.length === 0) {
      return { data: [], nextCursor: null, minDiasAltaLiquidez: MIN_DIAS_ALTA_LIQUIDEZ };
    }

    const totalFacturas = await this.redis.zcard(publicadasKey);

    const pipeline = this.redis.pipeline();
    facturaKeys.forEach((key) => pipeline.hgetall(key));
    const resultados = (await pipeline.exec()) as [
      Error | null,
      Record<string, string>,
    ][];

    const facturas: FacturaMarketplace[] = [];
    for (const [, [error, data]] of resultados.entries()) {
      if (error || Object.keys(data).length === 0) {
        continue;
      }
      facturas.push({
        facturaId: data.facturaId,
        folio: data.folio,
        razonSocial: data.razonSocial,
        rutDeudor: data.rutDeudor,
        monto: parseFloat(data.monto),
        fechaVencimiento: data.fechaVencimiento,
        diasRestantes: parseInt(data.diasRestantes, 10),
        cantidadOfertas: parseInt(data.cantidadOfertas, 10),
        tasaMinima: data.tasaMinima ? parseFloat(data.tasaMinima) : null,
        esPreferido: data.esPreferido === 'true',
        tieneOfertaPropia: data.tieneOfertaPropia === 'true',
        publicadoEn: data.publicadoEn,
      });
    }

    const nextOffset = offset + facturas.length;
    const nextCursor =
      nextOffset < totalFacturas
        ? Buffer.from(String(nextOffset)).toString('base64')
        : null;

    return { data: facturas, nextCursor, minDiasAltaLiquidez: MIN_DIAS_ALTA_LIQUIDEZ };
  }

  async setFacturaInCache(factura: FacturaModel): Promise<FacturaMarketplace> {
    const pipeline = this.redis.pipeline();

    const facturaKey = this.key.factura(factura.publiInvoiceId);
    const ownerKey = this.key.facturaIndexOwner(factura.ownerUUID);
    const deudorKey = this.key.facturaIndexDeudor(factura.deudorRut);
    const publicadasKey = this.key.facturaIndexPublicadas();

    const facturaData: FacturaMarketplace = {
      facturaId: factura.publiInvoiceId,
      folio: factura.facturaNumero,
      razonSocial: factura.deudorNombre,
      rutDeudor: factura.deudorRut,
      monto: factura.montoTotal,
      fechaVencimiento: factura.fechaVencimiento.toISOString(),
      diasRestantes: Math.ceil(
        (factura.fechaVencimiento.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      cantidadOfertas: factura.total_ofertas,
      tasaMinima: factura.mejor_tasa || null,
      esPreferido: false, // Este valor puede ser determinado según la lógica de negocio
      tieneOfertaPropia: false, // Este valor puede ser determinado según la lógica de negocio
      publicadoEn: factura.created_at.toISOString(),
    };

    await this.redis.hset(facturaKey, facturaData);
    const timestamp = Date.now();
    pipeline.zadd(ownerKey, timestamp, facturaKey);
    pipeline.zadd(deudorKey, timestamp, facturaKey);
    pipeline.zadd(publicadasKey, timestamp, facturaKey);
    pipeline.expire(ownerKey, 86400);
    pipeline.expire(deudorKey, 86400);
    pipeline.expire(publicadasKey, 86400);
    pipeline.expire(facturaKey, 86400);

    await pipeline.exec();
    return facturaData;
  }

  async deleteFacturaFromCache(
    id: string,
    ownerUUID: string,
    deudorRut: string,
  ): Promise<void> {
    const key = this.key.factura(id);
    const ownerKey = this.key.facturaIndexOwner(ownerUUID);
    const deudorKey = this.key.facturaIndexDeudor(deudorRut);
    const publicadasKey = this.key.facturaIndexPublicadas();

    const pipeline = this.redis.pipeline();
    pipeline.del(key);
    pipeline.srem(ownerKey, key);
    pipeline.srem(deudorKey, key);
    pipeline.srem(publicadasKey, key);
    await pipeline.exec();
  }
}
