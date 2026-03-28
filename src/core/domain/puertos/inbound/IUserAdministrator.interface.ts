import { UserProfileModel } from "../../model/userProfile.model";


export interface IUserProfileAdministratorUseCase {
    ExecuteGetUserProfile(uuid: string): Promise<UserProfileModel>;
}