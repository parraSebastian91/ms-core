/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserProfileController } from './controllers/user-profile.controller';
import { RolesGuard } from './guards/roles.guard';
import { WebhookController } from './controllers/webhook.controller';
import { HealthcheckController } from './controllers/healthcheck.controller';
import { FacturaManagerController } from './controllers/factura-manager.controller';
import { AccessTokenInterceptor } from './middleware/access-token.interceptor';
import { LoggerInterceptor } from './middleware/loggin.interceptor';
import { AccessTokenContext } from './middleware/access-token.context';
import { CatalogoController } from './controllers/catalogo.controller';
import { CatalogoRepositoryAdapter } from '../../outbound/database/adapters/catalogoRepository.adapter';
import { CATALOGO_REPOSITORY } from 'src/core/domain/puertos/outbound/ICatalogo.repository';
import { OrganizacionController } from './controllers/organizacion.controller';
import { VerificacionTributariaRepositoryAdapter } from '../../outbound/database/adapters/verificacionTributariaRepository.adapter';
import { organizacionRepositoriAdapter } from '../../outbound/database/adapters/organizacionRepository.adapter';
import { ORGANIZACION_REPOSITORY } from 'src/core/domain/puertos/outbound/IOrganizacion.repository';
import { SolicitudAccesoController } from './controllers/solicitudAcceso.controller';
import { SolicitudAccesoRepositoryAdapter } from '../../outbound/database/adapters/solicitudAccesoRepository.adapter';
import { SOLICITUD_ACCESO_REPOSITORY } from 'src/core/domain/puertos/outbound/ISolicitudAcceso.repository';
import { OrganizacionAdminController } from './controllers/organizacion-admin.controller';
import { OrganizacionAdminRepositoryAdapter } from '../../outbound/database/adapters/organizacionAdminRepository.adapter';
import { ORGANIZACION_ADMIN_REPOSITORY } from 'src/core/domain/puertos/outbound/IOrganizacionAdmin.repository';
import { TributaryService } from 'src/core/application/service/tributary.service';
import { StorageController } from './controllers/storage.controller';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN as any || '1h' },
        }),
    ],
    controllers: [
        UserProfileController,
        WebhookController,
        HealthcheckController,
        FacturaManagerController,
        CatalogoController,
        OrganizacionController,
        SolicitudAccesoController,
        OrganizacionAdminController,
        StorageController
    ],
    providers: [
        AccessTokenContext,
        AuthGuard,
        PermissionsGuard,
        RolesGuard,
        CatalogoRepositoryAdapter,
        {
            provide: CATALOGO_REPOSITORY,
            useExisting: CatalogoRepositoryAdapter,
        },
        VerificacionTributariaRepositoryAdapter,
        organizacionRepositoriAdapter,
        {
            provide: ORGANIZACION_REPOSITORY,
            useExisting: organizacionRepositoriAdapter,
        },
        SolicitudAccesoRepositoryAdapter,
        {
            provide: SOLICITUD_ACCESO_REPOSITORY,
            useExisting: SolicitudAccesoRepositoryAdapter,
        },
        OrganizacionAdminRepositoryAdapter,
        {
            provide: ORGANIZACION_ADMIN_REPOSITORY,
            useExisting: OrganizacionAdminRepositoryAdapter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AccessTokenInterceptor,
        },
    ],
    exports: [
        AccessTokenContext
    ],
})
export class HttpServerModule { }
