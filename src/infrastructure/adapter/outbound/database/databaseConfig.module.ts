import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecretsModule } from '../../../secrets/secrets.module';
import { RlsQueryRunner } from './rls-query-runner.service';

@Module({
    imports: [
        SecretsModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async ( configService: ConfigService) => {
                return {
                    type: 'postgres',
                    host: configService.get('database.host') ,
                    port: parseInt(configService.get('database.port'), 10) ,
                    username: configService.get('database.username') ,
                    password: configService.get('database.password') ,
                    database: configService.get('database.database') ,
                    schema: 'core' ,
                    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
                    synchronize: false,
                    logging: true,
                    logger: 'advanced-console',
                    maxQueryExecutionTime: 1000,
                    ssl: configService.get('database.ssl') === 'true',
                    extra: {
                        ssl: configService.get('database.ssl') === 'true',
                        connectionTimeoutMillis: 5000,
                        query_timeout: 10000,
                        statement_timeout: 10000,
                    },
                };
            },
        }),
    ],
    providers: [RlsQueryRunner],
    exports:   [RlsQueryRunner],
})
export class DatabaseModule {}