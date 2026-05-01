import { UserOrganizacionProfileModel } from "src/core/domain/model/userOrganizacionProfile.model";

export class UserOrganizacionProfileDTO {
    nombre_contacto: string;
    cargo: string;
    razon_social: string;
    organizacion_uuid: string;

    static fromModelArray(models: UserOrganizacionProfileModel[]): UserOrganizacionProfileDTO[] {
        return models.map(model => {
            const dto = new UserOrganizacionProfileDTO();
            dto.nombre_contacto = model.nombre_contacto;
            dto.cargo = model.cargo;
            dto.razon_social = model.razon_social;
            dto.organizacion_uuid = model.organizacion_uuid;
            return dto;
        });
    }
}