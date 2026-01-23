/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsuarioController } from './controllers/usuario.controller';
import { ContactoController } from './controllers/Contacto.controller';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { SistemaController } from './controllers/sistema.controller';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        }),
    ],
    controllers: [
        UsuarioController,
        ContactoController,
        SistemaController
    ],
    providers: [
        AuthGuard,
        PermissionsGuard,
        // Aplicar AuthGuard globalmente
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        // Aplicar PermissionsGuard globalmente después del AuthGuard
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
    ],
})
export class HttpServerModule { }
