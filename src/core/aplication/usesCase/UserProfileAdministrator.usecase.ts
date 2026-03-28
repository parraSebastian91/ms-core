import { Injectable } from "@nestjs/common";
import { IUserProfileAdministratorUseCase } from "./../../domain/puertos/inbound/IUserAdministrator.interface";
import { UserProfileModel } from "./../../domain/model/userProfile.model";
import { IContactoRepository } from "./../../domain/puertos/outbound/iContactoRepository.interface";

@Injectable()
export class UserProfileAdministratorUseCase implements IUserProfileAdministratorUseCase {

    constructor(
        private contactoRepository: IContactoRepository
    ) {}


    async ExecuteGetUserProfile (uuid: string): Promise<UserProfileModel> {
        return new UserProfileModel();
    }
}