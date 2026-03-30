import { Injectable, Logger } from "@nestjs/common";
import { IUserProfileAdministratorUseCase } from "../../../domain/puertos/inbound/IUserAdministrator.interface";
import { UserProfileModel } from "../../../domain/model/userProfile.model";
import { GetProfileQuery } from "./query/getProfile.query";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";

@Injectable()
export class UserProfileAdministratorUseCase implements IUserProfileAdministratorUseCase {
    private readonly logger = new Logger(UserProfileAdministratorUseCase.name);
    constructor(
        private userProfileRepository: IUserProfileRepository
    ) {}


    async ExecuteGetUserProfile (query: GetProfileQuery): Promise<UserProfileModel> {
        const userProfile = await this.userProfileRepository.getUserProfile(query.uuid);
        if (!userProfile) {
            this.logger.warn(`User profile not found for UUID: ${query.uuid}`);
            throw new Error("User profile not found");
        }
        this.logger.log(`User profile retrieved for UUID: ${query.uuid}`);
        console.log(userProfile);
        return userProfile;
    }
}