import { UserOrganizacionProfileModel } from "../../model/userOrganizacionProfile.model";
import { UserProfileModel } from "../../model/userProfile.model";
import { ProfileImageModel } from "../../model/userProfileImage.model";

export interface IUserProfileRepository {
    getUserProfile(uuid: string): Promise<UserProfileModel | null>;
    GetSistema(uuid: string): Promise<any>;
    GetUserProfileImage(uuid: string): Promise<ProfileImageModel[]>;
    UpdateUserProfile(uuid: string, data: UserProfileModel): Promise<UserProfileModel>;
    getOrganizacionByUsuario(uuid: string): Promise<UserOrganizacionProfileModel[]>
    /**
     * 
     * @param usuario puede ser tanto userName o UUID de usuario
     * @param organizacion_uuid 
     */
    validateUserAndOrganizacion(usuario: string, organizacion_uuid: string): Promise<boolean>;
    getUserProfileByUsername(usuario: string, organizacion_uuid: string): Promise<{ profile: { userName: string, usuario_uuid: string, organizacion_uuid: string } | null, isValid: boolean }>;
}