import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  getToken,
} from '@willsoto/nestjs-prometheus';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'core_facturas_created_total',
      help: 'Total de facturas creadas/publicadas',
    }),
    makeCounterProvider({
      name: 'core_facturas_authorized_total',
      help: 'Total de facturas autorizadas para publicación',
    }),
    makeCounterProvider({
      name: 'core_ofertas_created_total',
      help: 'Total de ofertas creadas en el marketplace',
    }),
    makeCounterProvider({
      name: 'core_marketplace_requests_total',
      help: 'Total de consultas al marketplace de facturas',
      labelNames: ['endpoint'],
    }),
  ],
  exports: [
    getToken('core_facturas_created_total'),
    getToken('core_facturas_authorized_total'),
    getToken('core_ofertas_created_total'),
    getToken('core_marketplace_requests_total'),
  ],
})
export class MetricsModule {}