import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Evita IDOR: el `:uuid` de la ruta debe ser el del usuario autenticado (claim `userUuid` del token).
 * Un usuario no puede leer ni modificar el perfil de otro cambiando el UUID de la URL.
 */
@Injectable()
export class SelfOnlyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authenticated = request.user?.userUuid;
        const requested = request.params?.uuid;
        if (!authenticated || !requested || String(requested).toLowerCase() !== String(authenticated).toLowerCase()) {
            throw new ForbiddenException('Solo puedes acceder a tu propio perfil');
        }
        return true;
    }
}
