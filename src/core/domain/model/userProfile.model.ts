export class UserProfileModel {
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
    }
}