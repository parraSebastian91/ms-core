/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
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
            envFilePath: ['.env.dev', '.env'],
        }),
        ClientsModule.registerAsync([
            {
                name: 'OBJECT_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    const host = configService.get<string>('rabbitmq.host') || 'rabbitmq';
                    const port = configService.get<number>('rabbitmq.port') || 5672;
                    const user = configService.get<string>('rabbitmq.user') || 'core';
                    const pass = configService.get<string>('rabbitmq.pass') || 'core-123';
                    const queue = configService.get<string>('rabbitmq.queue') || 'object_queue';

                    return {
                        transport: Transport.RMQ,
                        options: {
                            urls: [`amqp://${user}:${pass}@${host}:${port}`],
                            queue,
                            queueOptions: {
                                durable: true,
                            },
                        },
                    };
                },
            },
        ]),
    ],
    providers: [
        UserProfileRepositoryAdapter
    ],
    exports: [
        UserProfileRepositoryAdapter
    ],
})
export class InfraestructureModule { }
