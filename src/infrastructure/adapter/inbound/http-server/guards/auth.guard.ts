import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AccessTokenPayload } from 'src/core/domain/model/jwt.model';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    if (isPublic || request.path === '/metrics') {
      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('Token de acceso no proporcionado');
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      // Validar el token usando el servicio de autenticación
      const tokenValid = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });

      if (!tokenValid) {
        this.logger.warn('Token inválido o expirado');
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Verificar la estructura del token JWT para obtener información adicional
      const payload = this.jwtService.decode(token) as AccessTokenPayload;

      if (!payload) {
        this.logger.warn('Token malformado');
        throw new UnauthorizedException('Token malformado');
      }

      const tokenRoles = payload.roles || [];
      const tokenPermissions = payload.permissions || [];

      // console.log('Token payload:', payload);
      // console.log('Roles del token (códigos):', tokenRoles);
      // console.log('Permisos del token (códigos):', tokenPermissions);

      // Agregar información del usuario al request para uso posterior
      request['user'] = {
        userId: payload.userId,
        userName: payload.userName,
        userUuid: payload.userUuid,
        roles: tokenRoles,
        permissions: tokenPermissions,
        token: token // Incluir el token original para uso en otros guards
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al validar el token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}