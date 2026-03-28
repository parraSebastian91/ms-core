import { UserProfileModel } from "./../../core/domain/model/userProfile.model";

export class UserProfileMapper {

    static toModel(entity: any): UserProfileModel {
        return new UserProfileModel();
    }


}