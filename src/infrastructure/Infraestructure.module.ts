/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/databaseConfig.module';
import { HttpServerModule } from './http-server/http-server.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretsModule } from './secrets/secrets.module';
import { ConfigModule, ConfigService, ConfigModule as NestConfigModule } from '@nestjs/config';
import { MetricsModule } from './metrics/metrics.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisStore } from 'connect-redis';
import { UserProfileRepositoryAdapter } from './adapter/userProfileRepository.adapter';

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
    ],
    providers: [
        UserProfileRepositoryAdapter
    ],
    exports: [
        UserProfileRepositoryAdapter
    ],
})
export class InfraestructureModule { }
