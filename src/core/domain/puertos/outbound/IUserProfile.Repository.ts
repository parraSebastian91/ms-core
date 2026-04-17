import { UserProfileModel } from "../../model/userProfile.model";
import { ProfileImageModel } from "../../model/userProfileImage.model";

export interface IUserProfileRepository {
    getUserProfile(uuid: string): Promise<UserProfileModel | null>;
    GetSistema(uuid: string): Promise<any>;
    GetUserProfileImage(uuid: string): Promise<ProfileImageModel[]>;
    UpdateUserProfile(uuid: string, data: UserProfileModel): Promise<UserProfileModel>;
}