import { UserProfileModel } from "src/core/domain/model/userProfile.model";


export class UserProfileDTO {
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
    avatar: string; 
    tipo_contacto: string;


    static builder(userProfile: UserProfileModel): UserProfileDTO {
        const userProfileDTO = new UserProfileDTO();
        userProfileDTO.usuario_uuid = userProfile.usuario_uuid;
        userProfileDTO.username = userProfile.username;
        userProfileDTO.ingreso = userProfile.ingreso;
        userProfileDTO.activo = userProfile.activo;
        userProfileDTO.nombres = userProfile.nombres;
        userProfileDTO.apellido_paterno = userProfile.apellido_paterno;
        userProfileDTO.apellido_materno = userProfile.apellido_materno;
        userProfileDTO.direccion = userProfile.direccion;
        userProfileDTO.celular = userProfile.celular;
        userProfileDTO.correo = userProfile.correo;
        userProfileDTO.fecha_nacimiento = userProfile.fecha_nacimiento;
        userProfileDTO.redes_sociales = userProfile.redes_sociales;
        userProfileDTO.tipo_documento = userProfile.tipo_documento;
        userProfileDTO.numero_documento = userProfile.numero_documento;
        userProfileDTO.tipo_contacto = userProfile.tipo_contacto;
        return userProfileDTO;
    }

}