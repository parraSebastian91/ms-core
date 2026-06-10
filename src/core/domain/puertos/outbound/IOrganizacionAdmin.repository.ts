export const ORGANIZACION_ADMIN_REPOSITORY = 'ORGANIZACION_ADMIN_REPOSITORY';

// ── Miembros ──────────────────────────────────────────────────────────────────

export interface OrgMiembroRow {
    miembroId: number;
    usuarioUuid: string;
    nombre: string;
    apellido: string;
    email: string;
    avatarUrl: string | null;
    rolCodigo: string;
    rolNombre: string;
    incorporadoEn: string;
}

// ── Grupos ────────────────────────────────────────────────────────────────────

export interface GrupoMiembroRow {
    miembroId: string;
    usuarioUuid: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
    cargoEnGrupo: string | null;
}

export interface GrupoRow {
    grupoId: string;
    nombre: string;
    descripcion: string | null;
    liderUuid: string;
    liderNombre: string;
    liderApellido: string;
    activo: boolean;
    creadoEn: string;
    miembros: GrupoMiembroRow[];
}

export interface CrearGrupoInput {
    organizacionId: number;
    nombre: string;
    descripcion?: string;
    liderUuid: string;
}

// ── Interfaz principal ────────────────────────────────────────────────────────

export interface OrgBasicData {
    id: number;
    razonSocial: string;
    descripcion: string | null;
    logoUrl: string | null;
    rut: string;
    dv: string;
}

export interface IOrganizacionAdminRepository {
    // ── Datos básicos de la organización ───────────────────────────────────
    getOrganizacionById(organizacionId: number): Promise<OrgBasicData | null>;
    getRolMiembro(organizacionId: number, usuarioUuid: string): Promise<string | null>;

    // ── Miembros de la organización ─────────────────────────────────────────
    listarMiembros(organizacionId: number): Promise<OrgMiembroRow[]>;
    cambiarRolMiembro(organizacionId: number, usuarioUuid: string, rolCodigo: string): Promise<{ ok: boolean }>;
    removerMiembro(organizacionId: number, usuarioUuid: string): Promise<{ ok: boolean }>;

    // ── Grupos de trabajo ───────────────────────────────────────────────────
    listarGrupos(organizacionId: number): Promise<GrupoRow[]>;
    crearGrupo(input: CrearGrupoInput): Promise<GrupoRow>;
    actualizarGrupo(grupoId: string, nombre: string, descripcion?: string): Promise<{ ok: boolean }>;
    eliminarGrupo(grupoId: string): Promise<{ ok: boolean }>;
    agregarMiembroGrupo(grupoId: string, usuarioUuid: string, cargoEnGrupo?: string): Promise<{ ok: boolean }>;
    removerMiembroGrupo(grupoId: string, usuarioUuid: string): Promise<{ ok: boolean }>;

    // ── Enrolamiento ────────────────────────────────────────────────────────
    /** Genera un token de enrolamiento (solicitud pre-aprobada) y lo retorna.
     *  El llamador puede enviarlo por email. El colaborador usa el token para
     *  completar el registro sin pasar por la cola de aprobación. */
    generarTokenEnrolamiento(
        organizacionId: number,
        adminUuid: string,
        rolDestino?: string,
    ): Promise<{ token: string; expiraEn: string }>;
}
