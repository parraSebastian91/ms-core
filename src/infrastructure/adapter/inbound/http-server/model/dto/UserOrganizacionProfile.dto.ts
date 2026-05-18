import { UserOrganizacionProfileModel } from "src/core/domain/model/userOrganizacionProfile.model";

export class UserOrganizacionProfileDTO {
    nombre_contacto: string;
    cargo: string;
    razon_social: string;
    organizacion_uuid: string;
    orden: number;
    usuario_uuid: string;
    userName: string;
    tipo_participante: string;
    static fromModelArray(models: UserOrganizacionProfileModel[]): UserOrganizacionProfileDTO[] {
        return models.map(model => {
            const dto = new UserOrganizacionProfileDTO();
            dto.nombre_contacto = model.nombre_contacto;
            dto.cargo = model.cargo;
            dto.razon_social = model.razon_social;
            dto.organizacion_uuid = model.organizacion_uuid;
            dto.orden = model.orden || 1; // Asignar un valor predeterminado si orden es undefined o null
            dto.usuario_uuid = model.usuario_uuid;
            dto.userName = model.userName;
            dto.tipo_participante = model.tipo_participante;
            return dto;
        }).sort((a, b) => a.orden - b.orden);
    }
}