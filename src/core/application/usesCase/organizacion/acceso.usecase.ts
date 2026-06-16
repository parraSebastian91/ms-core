import { ConflictException, NotFoundException } from "@nestjs/common";
import { ISolicitudeAcceso } from "src/core/domain/puertos/inbound/ISolicitudeAcceso.Interface";
import { ISolicitudAccesoRepository, ResolverSolicitudInput } from "src/core/domain/puertos/outbound/ISolicitudAcceso.repository";

export class AccesoOrganizacionUseCase implements ISolicitudeAcceso {

    constructor(
        private readonly repo: ISolicitudAccesoRepository,
    ) { }

    async ExecuteResolverSolicitud(input: ResolverSolicitudInput): Promise<{ ok: boolean }> {
        await this.repo.marcarSolicitudesExpiradas();
        const solicitud = await this.repo.getSolicitudPorToken(input.token);
        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada o token inválido.');
        }
        if (solicitud.estado !== 'PENDIENTE') {
            throw new ConflictException(`La solicitud ya fue ${solicitud.estado.toLowerCase()}.`);
        }
        if (input.decision === 'APROBADA') {
            await this.repo.asociarUsuarioAOrganizacion(solicitud.organizacionId, solicitud.solicitanteUuid, solicitud.rolSolicitado, input.adminUuid);
        }
        return this.repo.solveSolicitud(input);
    }

    async ExecuteSolicitarAcceso(
        organizacionUuid: string,
        solicitanteUuid: string,
        rolSolicitado?: string,
        mensaje?: string,
    ): Promise<{ solicitudId: number; token: string; expiraEn: string }> {
        await this.repo.marcarSolicitudesExpiradas();
        const { orgId, existe } = await this.repo.existenSolicitudesPendientes(organizacionUuid, solicitanteUuid);
        if (existe) {
            throw new ConflictException('Ya tienes una solicitud de acceso pendiente para esta organización.');
        }

        return this.repo.crearSolicitud({
            organizacionId: orgId,
            solicitanteUuid,
            rolSolicitado,
            mensaje,
        });
    }

    async ExecuteListarSolicitudes(organizacionUuid: string, estado?: string) {
        await this.repo.marcarSolicitudesExpiradas();
        return this.repo.listarPorOrganizacion(organizacionUuid, estado);
    }

    async ExecuteObtenerPorToken(token: string) {
        await this.repo.marcarSolicitudesExpiradas();
        return this.repo.getSolicitudPorToken(token);
    }

    async ExecuteCancelarSolicitud(solicitudId: number, solicitanteUuid: string) {
        await this.repo.marcarSolicitudesExpiradas();
        return this.repo.cancelar(solicitudId, solicitanteUuid);
    }
}