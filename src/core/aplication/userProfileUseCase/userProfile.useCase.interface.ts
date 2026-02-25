import { commandUpdateUserProfile } from "./command/updateProfile.command";

export interface IUserProfileUseCase {
    getUserProfile(uuid: string): Promise<any>;
    updateUserProfile(uuid: string, command: commandUpdateUserProfile): Promise<any>;
    updateUserAvatar(uuid: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<string>;
}