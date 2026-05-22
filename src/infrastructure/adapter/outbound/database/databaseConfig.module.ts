import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultService } from '../../../secrets/vault.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecretsModule } from '../../../secrets/secrets.module';

@Module({
    imports: [
        SecretsModule,
        TypeOrmModule.forRootAsync({
            imports: [SecretsModule, ConfigModule],
            inject: [VaultService, ConfigService],
            useFactory: async (vaultService: VaultService, configService: ConfigService) => {
                return {
                    type: 'postgres',
                    host: configService.get('database.host') ,
                    port: parseInt(configService.get('database.port'), 10) ,
                    username: configService.get('database.username') ,
                    password: configService.get('database.password') ,
                    database: configService.get('database.database') ,
                    schema: 'core' ,
                    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
                    synchronize: false,  // ← NO usar true en producción
                    // ✅ ACTIVAR LOGGING COMPLETO
                    logging: true,  // O más específico:  ['query', 'error', 'schema', 'warn', 'info', 'log']
                    logger: 'advanced-console',  // O 'debug', 'simple-console'

                    // ✅ Ver todas las queries
                    maxQueryExecutionTime: 1000,
                    // ✅ Opciones adicionales de debugging
                    ssl: true,
                    extra: {
                        ssl:true,
                        connectionTimeoutMillis: 5000,
                        query_timeout: 10000,
                        statement_timeout: 10000,
                    },
                }
            },
        })
    ]
})
export class DatabaseModule {
    // This module can be used to configure database specific settings or providers
    // if needed in the future.
}