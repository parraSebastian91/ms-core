/*
https://docs.nestjs.com/modules
*/

import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from './adapter/outbound/database/databaseConfig.module';
import { HttpServerModule } from './adapter/inbound/http-server/http-server.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretsModule } from './secrets/secrets.module';
import { ConfigModule, ConfigService, ConfigModule as NestConfigModule } from '@nestjs/config';
import { MetricsModule } from './metrics/metrics.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisStore } from 'connect-redis';
import { UserProfileRepositoryAdapter } from './adapter/outbound/database/adapters/userProfileRepository.adapter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FacturaRepositoryAdapter } from './adapter/outbound/database/adapters/facturaRepository.adapter';
import { MESSAGE_PUBLISHER } from 'src/core/domain/puertos/inbound/message.publisher.interface';
import { QueueClientAdapter } from './adapter/outbound/queue/queue-client.adapter';
import { WorkTeamRepositoryAdapter } from './adapter/outbound/database/adapters/workTeamRepositori.adapter';
import { STORAGE_SERVICE } from 'src/core/domain/puertos/outbound/IStorageService.interface';
import { AccessTokenContext } from './adapter/inbound/http-server/middleware/access-token.context';
import axios, { AxiosHeaders } from 'axios';
import { StorageServiceAdapter } from './adapter/outbound/external-Service/storageService.adapter';
import { PermisosRepositoryAdapter } from './adapter/outbound/database/adapters/permisosManagerRepository.adapter';
import { organizacionRepositoriAdapter } from './adapter/outbound/database/adapters/organizacionRepository.adapter';
import { CatalogoRepositoryAdapter } from './adapter/outbound/database/adapters/catalogoRepository.adapter';
import { CATALOGO_REPOSITORY } from 'src/core/domain/puertos/outbound/ICatalogo.repository';

const NOTIFICATION_MODULE = 'NOTIFICATION_SERVICE';

@Module({
    imports: [
        DatabaseModule,
        SecretsModule,
        HttpServerModule,
        MetricsModule,
        ConfigModule,
        CacheModule.register({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                isGlobal: true,
                store: RedisStore,
                host: configService.get('redis.host') || 'localhost',
                port: configService.get('redis.port') || '6379',
                ttl: configService.get('redis.ttl') || '3600', // 1 hora por defecto
            }),
        }),
        TypeOrmModule.forFeature([
        ]),
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.dev'],
        }),
        ClientsModule.registerAsync([
            {
                name: NOTIFICATION_MODULE,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    const host = configService.get<string>('rabbitmq.host') || 'rabbitmq';
                    const port = configService.get<number>('rabbitmq.port') || 5672;
                    const user = configService.get<string>('rabbitmq.user') || 'core';
                    const pass = configService.get<string>('rabbitmq.pass') || 'core-123';
                    const queue = configService.get<string>('rabbitmq.queue') || 'notify_queue';
                    const exchange = configService.get<string>('rabbitmq.exchange') || 'storage_notifications_exchange';
                    const routingKey = configService.get<string>('rabbitmq.routingKey') || 'dte.process.notification';

                    return {
                        transport: Transport.RMQ,
                        options: {
                            urls: [`amqp://${user}:${pass}@${host}:${port}`],
                            queue,
                            exchange,
                            exchangeType: 'topic',
                            routingKey,
                            queueOptions: {
                                durable: true,
                            },
                            noAck: true,    // publisher no necesita ACK
                            isGlobal: false,
                        },
                    };
                },
            },
        ]),
    ],
    providers: [
        UserProfileRepositoryAdapter,
        FacturaRepositoryAdapter,
        QueueClientAdapter,
        WorkTeamRepositoryAdapter,
        StorageServiceAdapter,
        PermisosRepositoryAdapter,
        organizacionRepositoriAdapter,
        CatalogoRepositoryAdapter,
        {
            provide: CATALOGO_REPOSITORY,
            useExisting: CatalogoRepositoryAdapter,
        },
        {
            provide: MESSAGE_PUBLISHER,
            useExisting: QueueClientAdapter,
        },
        {
            provide: STORAGE_SERVICE,
            inject: [ConfigService, AccessTokenContext],
            useFactory: (configService: ConfigService, accessTokenContext: AccessTokenContext) => {
                const baseUrl = configService.get<string>('externalServices.storage.baseUrl');
                const logger = new Logger('InfrastructureModule');
                logger.debug(`Configurando cliente Axios para servicio Storage con baseURL: ${baseUrl}`);
                const client = axios.create({
                    baseURL: baseUrl,
                    timeout: configService.get<number>('externalServices.storage.timeout') ?? 8000,
                });

                client.interceptors.request.use((config) => {
                    const token = accessTokenContext.getAccessToken();
                    const correlationId = accessTokenContext.getCorrelationId();
                    if (!token && !correlationId) {
                        return config;
                    }

                    if (config.headers && typeof (config.headers as any).set === 'function') {
                        if (correlationId) {
                            (config.headers as any).set('X-Correlation-Id', correlationId);
                        }
                        if (token) {
                            (config.headers as any).set('access_token', token);
                            if (!(config.headers as any).has?.('Authorization')) {
                                (config.headers as any).set('Authorization', `Bearer ${token}`);
                            }
                        }
                        return config;
                    }

                    const headers = AxiosHeaders.from(config.headers ?? {});
                    if (correlationId) {
                        headers.set('X-Correlation-Id', correlationId);
                    }
                    if (token) {
                        headers.set('access_token', token);
                        if (!headers.has('Authorization')) {
                            headers.set('Authorization', `Bearer ${token}`);
                        }
                    }
                    config.headers = headers;

                    return config;
                });
                return client;
            }
        },
    ],
    exports: [
        UserProfileRepositoryAdapter,
        FacturaRepositoryAdapter,
        QueueClientAdapter,
        WorkTeamRepositoryAdapter,
        StorageServiceAdapter,
        PermisosRepositoryAdapter,
        organizacionRepositoriAdapter,
        CatalogoRepositoryAdapter,
        CATALOGO_REPOSITORY,
        STORAGE_SERVICE,
        ClientsModule
    ],
})
export class InfraestructureModule { }
