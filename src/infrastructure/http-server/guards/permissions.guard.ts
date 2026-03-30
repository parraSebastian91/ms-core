import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        // Obtener los permisos requeridos para esta ruta
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si no se especifican permisos, permitir acceso (solo con autenticación)
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();

        const user = request['user'];

        // Si no hay usuario en el request, significa que no pasó por AuthGuard
        if (!user || !user.userId) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        try {

            const userPermissions = user.permissions || [];

            // Validar permisos si se especificaron
            if (requiredPermissions && requiredPermissions.length > 0) {
                const hasRequiredPermission = requiredPermissions.some(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasRequiredPermission) {
                    throw new ForbiddenException(
                        `Acceso denegado. Permisos requeridos: ${requiredPermissions.join(', ')}`
                    );
                }
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('Error al verificar permisos del usuario');
        }
    }
}