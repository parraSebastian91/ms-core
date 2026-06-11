export const SOLICITUD_ACCESO_REPOSITORY = 'SOLICITUD_ACCESO_REPOSITORY';

export interface CrearSolicitudInput {
    organizacionId: number;
    solicitanteUuid: string;
    rolSolicitado?: string;
    mensaje?: string;
}

export interface ResolverSolicitudInput {
    token: string;
    adminUuid: string;
    decision: 'APROBADA' | 'RECHAZADA';
    motivoRechazo?: string;
}

export interface SolicitudRow {
    solicitudId: number;
    organizacionId: number;
    organizacionNombre: string;
    organizacionRut: string;
    solicitanteUuid: string;
    solicitanteNombre: string;
    solicitanteApellido: string;
    solicitanteEmail: string;
    rolSolicitado: string;
    mensaje: string | null;
    token: string;
    estado: string;
    resueltoPor: string | null;
    resueltoEn: string | null;
    motivoRechazo: string | null;
    creadoEn: string;
    expiraEn: string;
    estaExpirada: boolean;
}

export interface ISolicitudAccesoRepository {
    /** Colaborador solicita acceso — devuelve la solicitud creada */
    crear(input: CrearSolicitudInput): Promise<{ solicitudId: number; token: string; expiraEn: string }>;

    /** Igual que crear() pero resolviendo la organización por UUID en lugar de ID entero */
    crearPorUuid(organizacionUuid: string, solicitanteUuid: string, rolSolicitado?: string, mensaje?: string): Promise<{ solicitudId: number; token: string; expiraEn: string }>;

    /** Admin obtiene solicitudes pendientes de su organización */
    listarPorOrganizacion(organizacionUuid: string, estado?: string): Promise<SolicitudRow[]>;

    /** Obtener una solicitud por token (para el link de email) */
    obtenerPorToken(token: string): Promise<SolicitudRow | null>;

    /** Admin aprueba o rechaza — si APROBADA, inserta en organizacion_miembro */
    resolver(input: ResolverSolicitudInput): Promise<{ ok: boolean }>;

    /** Colaborador cancela su propia solicitud pendiente */
    cancelar(solicitudId: number, solicitanteUuid: string): Promise<{ ok: boolean }>;
}
