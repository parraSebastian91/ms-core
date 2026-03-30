/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserProfileController } from './controllers/user-profile.controller';
import { RolesGuard } from './guards/roles.guard';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        }),
    ],
    controllers: [
        UserProfileController
    ],
    providers: [
        AuthGuard,
        PermissionsGuard,
        RolesGuard,
        // Aplicar AuthGuard globalmente
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
    ],
})
export class HttpServerModule { }
