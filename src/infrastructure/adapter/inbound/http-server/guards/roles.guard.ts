import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    // Obtener los roles requeridos para esta ruta
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se especifican roles, permitir acceso (solo con autenticación)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    // Si no hay usuario en el request, significa que no pasó por AuthGuard
    if (!user || !user.userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    try {

      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));

        if (!hasRequiredRole) {
          throw new ForbiddenException(
            `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`
          );
        }
      }      

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Error al verificar roles del usuario');
    }
  }
}