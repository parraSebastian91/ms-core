import { Body, Controller, Delete, Get, HttpCode, Inject, Logger, Options, Param, Post, Put, UseFilters, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactoDTO } from "../model/dto/contacto.dto";
import { ValidationPipe } from "../pipes/validation.pipe";
import { IContactoAplication } from "src/core/aplication/contacto/iContactoAplication.interface";
import { ITipoContactoAplication } from "src/core/aplication/tipoContacto/iTipoContactoAplication.interface";
import { CoreExceptionFilter } from "src/infrastructure/exceptionFileter/contacto.filter";
import { CONTACTO_APPLICATION, TIPO_CONTACTO_APPLICATION, USER_PROFILE_APPLICATION } from "src/core/core.module";
import { Permissions } from "../decorators/permissions.decorator";
import { ApiResponse } from "../model/api-response.model";
import { In } from "typeorm";
import { IUserProfileUseCase } from "src/core/aplication/userProfileUseCase/userProfile.useCase.interface";


@Controller("contacto")
@UseFilters(CoreExceptionFilter)
export class ContactoController {

    constructor(
        @Inject(CONTACTO_APPLICATION) private readonly contactoApplication: IContactoAplication,
        @Inject(TIPO_CONTACTO_APPLICATION) private readonly tipoContactoApplication: ITipoContactoAplication,
        @Inject(USER_PROFILE_APPLICATION) private readonly userProfileUseCase: IUserProfileUseCase
    ) {
        // Initialization logic can go here if needed
    }

    /**
     * Endpoint to create a new contact
     * @param postContactoRequest - The request body containing contact details
     * @returns A promise that resolves when the contact is created
     */

    @HttpCode(201)
    @Post()
    @Permissions('CNT_CREATE', 'SYS_ADMIN')
    async createContacto(
        @Body(new ValidationPipe()) postContactoRequest: ContactoDTO
    ): Promise<ContactoDTO> {
        Logger.warn("Creating a new contact");
        return this.contactoApplication.create(postContactoRequest);
    }

    @Put(':id')
    @Permissions('CNT_CREATE', 'CNT_EDIT', 'SYS_ADMIN')
    async updateContacto(
        @Param('id') id: string,
        @Body(new ValidationPipe()) putContactoRequest: ContactoDTO
    ): Promise<ContactoDTO> {
        Logger.warn(`Updating contact with id: ${id}`);
        return this.contactoApplication.update(id, putContactoRequest);
    }

    @Options('/tipo_contacto')
    async getContactosByTipo(): Promise<any> {
        Logger.warn("Fetching contacts grouped by type");
        return this.tipoContactoApplication.getAllTipoContacto();
    }

    @Get()
    async getAllContactos(): Promise<ContactoDTO[]> {
        Logger.warn("Fetching all contacts");
        return this.contactoApplication.findAll();
    }

    @Get(':id')
    @Permissions('CNT_VIEW', 'CNT_CREATE', 'CNT_EDIT', 'SYS_ADMIN')
    async getContactoById(@Param('id') id: string): Promise<ContactoDTO> {
        Logger.warn(`Fetching contact with id: ${id}`);
        return this.contactoApplication.findById(id);
    }

    @Get('username/:username')
    @Permissions('CNT_VIEW', 'CNT_CREATE', 'CNT_EDIT', 'SYS_ADMIN')
    async getContactoByUsername(@Param('username') username: string): Promise<ContactoDTO> {
        Logger.warn(`Fetching contact with username: ${username}`);
        return this.contactoApplication.findByUsername(username);
    }

    @Delete(':id')
    @Permissions('CNT_CREATE', 'SYS_ADMIN')
    async deleteContacto(@Param('id') id: string): Promise<void> {
        Logger.warn(`Deleting contact with id: ${id}`);
        return this.contactoApplication.delete(id);
    }

    @Put('/:uuid/profile')
    @Permissions('CNT_EDIT', 'SYS_ADMIN')
    async updateUserProfile(
        @Param('uuid') uuid: string,
        @Body() body: ContactoDTO,
    ): Promise<ApiResponse<string>> {
        Logger.warn(`Updating user profile for contact with uuid: ${uuid}`);

        const updatedProfile = await this.userProfileUseCase.updateUserProfile(uuid, body);

        return new ApiResponse(200, "Correcto", updatedProfile);
    }

    @Put('/:uuid/avatar')
    @Permissions('CNT_EDIT', 'SYS_ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async updateUserAvatar(
        @Param('uuid') uuid: string,
        @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
    ): Promise<ApiResponse<string>> {
        Logger.warn(`Updating avatar for contact with uuid: ${uuid}`);

        const updatedAvatar = await this.userProfileUseCase.updateUserAvatar(uuid, file);
        // file.buffer contiene el contenido del archivo
        // file.originalname es el nombre original
        // file.mimetype es el tipo de archivo (ej: image/png)
        // file.size es el tamaño en bytes

        return new ApiResponse(200, "Correcto", updatedAvatar);
    }



}