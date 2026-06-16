import { ResolverSolicitudInput } from "../outbound/ISolicitudAcceso.repository";

export interface ISolicitudeAcceso {
    ExecuteResolverSolicitud(input: ResolverSolicitudInput): Promise<{ ok: boolean }>;
    ExecuteSolicitarAcceso(
        organizacionUuid: string,
        solicitanteUuid: string,
        rolSolicitado?: string,
        mensaje?: string,
    ): Promise<{ solicitudId: number; token: string; expiraEn: string }>;
    ExecuteListarSolicitudes(organizacionUuid: string, estado?: string): Promise<any[]>;
    ExecuteCancelarSolicitud(solicitudId: number, solicitanteUuid: string): Promise<{ ok: boolean }>;
    ExecuteObtenerPorToken(token: string): Promise<any>;
}