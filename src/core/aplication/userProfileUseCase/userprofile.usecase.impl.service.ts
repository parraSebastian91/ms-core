/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { IUserProfileUseCase } from './userProfile.useCase.interface';
import { commandUpdateUserProfile } from './command/updateProfile.command';
import { IUsuarioRepository } from 'src/core/domain/puertos/outbound/iUsuarioRepository.interface';
import { IContactoRepository } from 'src/core/domain/puertos/outbound/iContactoRepository.interface';
import { IRolRepository } from 'src/core/domain/puertos/outbound/iRolRepository.interface';
import { UserNotFoundError } from 'src/core/share/errors/UserNotFound.error';
import { ContactoModel } from 'src/core/domain/model/contacto.model';

@Injectable()
export class UserProfileService implements IUserProfileUseCase {

    constructor(
        private usuarioRepository: IUsuarioRepository,
        private contactoRepository: IContactoRepository,
        private rolRepository: IRolRepository
    ) { }

    getUserProfile(uuid: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    async updateUserProfile(uuid: string, command: commandUpdateUserProfile): Promise<ContactoModel> {
        const contactoModel = await this.contactoRepository.findContactoByUserUUID(uuid);
        if (!contactoModel) {
            throw new UserNotFoundError('Contacto asociado al usuario no encontrado');
        }
        const contactoUpdated = ContactoModel.createByCommand(command, contactoModel);
        const contactoEntity = ContactoModel.toEntity(contactoUpdated);
        const updatedContacto = await this.contactoRepository.update(contactoModel.id.getValue(), contactoEntity);

        return updatedContacto
    }

    async updateUserAvatar(uuid: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number; }): Promise<string> {
        const contactoModel = await this.contactoRepository.findContactoByUserUUID(uuid);
        if (!contactoModel) {
            throw new UserNotFoundError('Contacto asociado al usuario no encontrado');
        }

        return "Avatar actualizado correctamente";
        // Aquí iría la lógica para actualizar el avatar del usuario
    }
}
