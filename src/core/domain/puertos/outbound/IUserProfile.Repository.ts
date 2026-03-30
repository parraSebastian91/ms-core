import { UserProfileModel } from "../../model/userProfile.model";

export interface IUserProfileRepository {
    getUserProfile(uuid: string): Promise<UserProfileModel | null>;
}