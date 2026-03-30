import { Injectable } from "@nestjs/common";
import { IUserProfileAdministratorUseCase } from "../../../domain/puertos/inbound/IUserAdministrator.interface";
import { UserProfileModel } from "../../../domain/model/userProfile.model";
import { GetProfileQuery } from "./query/getProfile.query";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";

@Injectable()
export class UserProfileAdministratorUseCase implements IUserProfileAdministratorUseCase {

    constructor(
        private userProfileRepository: IUserProfileRepository
    ) {}


    async ExecuteGetUserProfile (query: GetProfileQuery): Promise<UserProfileModel> {
        const userProfile = await this.userProfileRepository.getUserProfile(query.uuid);
        if (!userProfile) {
            throw new Error("User profile not found");
        }
        return userProfile;
    }
}