import { Injectable, Logger } from "@nestjs/common";
import { IUserProfileAdministratorUseCase } from "../../../domain/puertos/inbound/IUserAdministrator.interface";
import { UserProfileModel } from "../../../domain/model/userProfile.model";
import { GetProfileQuery } from "./query/getProfile.query";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";
import { ProfileImageModel } from "src/core/domain/model/userProfileImage.model";
import { UserOrganizacionProfileModel } from "src/core/domain/model/userOrganizacionProfile.model";


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
        return userProfile;
    }

    async ExecuteGetSystemNavigation(uuid: string): Promise<any> {
        const systemNavigation = await this.userProfileRepository.GetSistema(uuid);
        if (!systemNavigation) {
            this.logger.warn(`System navigation not found for UUID: ${uuid}`);
            throw new Error("System navigation not found");
        }
        this.logger.log(`System navigation retrieved for UUID: ${uuid}`);
        return systemNavigation;
    }

    async ExecuteGetUserProfileImage(uuid: string): Promise<ProfileImageModel[]> {
        const userProfileImage = await this.userProfileRepository.GetUserProfileImage(uuid);
        if (!userProfileImage) {
            this.logger.warn(`User profile image not found for UUID: ${uuid}`);
            throw new Error("User profile image not found");
        }
        this.logger.log(`User profile image retrieved for UUID: ${uuid}`);
        return userProfileImage;
    }

    async ExecuteUpdateUserProfile(uuid: string, data: any): Promise<any> {
        const updatedUserProfile = await this.userProfileRepository.UpdateUserProfile(uuid, data);
        if (!updatedUserProfile) {
            this.logger.warn(`Failed to update user profile for UUID: ${uuid}`);
            throw new Error("Failed to update user profile");
        }
        this.logger.log(`User profile updated for UUID: ${uuid}`);
        return updatedUserProfile;
    }

    async ExecuteGetUserOrganizacionByUsuario(uuid: string): Promise<UserOrganizacionProfileModel[]> {
        const userOrganizacionProfile = await this.userProfileRepository.getOrganizacionByUsuario(uuid);
        if (!userOrganizacionProfile) {
            this.logger.warn(`User organization profile not found for UUID: ${uuid}`);
            throw new Error("User organization profile not found");
        }
        this.logger.log(`User organization profile retrieved for UUID: ${uuid}`);
        return userOrganizacionProfile;
    }

}