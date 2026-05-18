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

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        }),
    ],
    controllers: [
        UserProfileController,
        WebhookController,
        HealthcheckController,
        FacturaManagerController
    ],
    providers: [
        AccessTokenContext,
        AuthGuard,
        PermissionsGuard,
        RolesGuard,
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
