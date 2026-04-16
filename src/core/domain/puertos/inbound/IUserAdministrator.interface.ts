import { GetProfileQuery } from "src/core/application/usesCase/userPofileAdministrator/query/getProfile.query";
import { UserProfileModel } from "../../model/userProfile.model";


export interface IUserProfileAdministratorUseCase {
    ExecuteGetUserProfile(query: GetProfileQuery): Promise<UserProfileModel>;
    ExecuteGetSystemNavigation(uuid: string): Promise<any>;
    ExecuteGetUserProfileImage(uuid: string): Promise<any>;
}