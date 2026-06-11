export class UserProfileModel {
    usuario_uuid: string;
    username: string;    
    ingreso: Date;
    activo: boolean;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    direccion: string;
    celular: string;
    correo: string;
    fecha_nacimiento: Date;
    redes_sociales: string;
    tipo_documento: string;
    numero_documento: string;
    tipo_contacto: string;
    /** Roles del sistema asignados al usuario (ej. ['ADMIN', 'OPERADOR']) */
    roles: string[];

    constructor(
    ) {
        this.username = "";
        this.ingreso = new Date();
        this.activo = false;
        this.nombres = "";
        this.apellido_paterno = "";
        this.apellido_materno = "";
        this.direccion = "";
        this.celular = "";
        this.correo = "";
        this.fecha_nacimiento = new Date();
        this.redes_sociales = "";
        this.tipo_documento = "";
        this.numero_documento = "";
        this.tipo_contacto = "";
        this.roles = [];
    }

    static fromData(row: any): UserProfileModel {   
        console.log("Mapping data to UserProfileModel:", row); // Debug log to check the input data      
        const userProfile = new UserProfileModel();
        userProfile.usuario_uuid = row.usuario_uuid;
        userProfile.username = row.username;
        userProfile.ingreso = row.ingreso;
        userProfile.activo = row.activo;
        userProfile.nombres = row.nombres;
        userProfile.apellido_paterno = row.apellido_paterno;
        userProfile.apellido_materno = row.apellido_materno;
        userProfile.direccion = row.direccion;
        userProfile.celular = row.celular;
        userProfile.correo = row.correo;
        userProfile.fecha_nacimiento = row.fecha_nacimiento;
        userProfile.redes_sociales = row.redes_sociales;
        userProfile.tipo_documento = row.tipo_documento;
        userProfile.numero_documento = row.numero_documento;
        userProfile.tipo_contacto = row.tipo_contacto;
        userProfile.roles = Array.isArray(row.roles) ? row.roles : [];
        return userProfile;
    }
}