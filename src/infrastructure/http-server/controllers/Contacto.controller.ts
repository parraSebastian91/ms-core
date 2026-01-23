import { Body, Controller, Delete, Get, HttpCode, Inject, Logger, Options, Param, Post, Put, UseFilters } from "@nestjs/common";
import { ContactoDTO } from "../model/dto/contacto.dto";
import { ValidationPipe } from "../pipes/validation.pipe";
import { IContactoAplication } from "src/core/aplication/contacto/iContactoAplication.interface";
import { ITipoContactoAplication } from "src/core/aplication/tipoContacto/iTipoContactoAplication.interface";
import { CoreExceptionFilter } from "src/infrastructure/exceptionFileter/contacto.filter";
import { CONTACTO_APPLICATION, TIPO_CONTACTO_APPLICATION } from "src/core/core.module";
import { Permissions } from "../decorators/permissions.decorator";


@Controller("contacto")
@UseFilters(CoreExceptionFilter)
export class ContactoController {

    constructor(
        @Inject(CONTACTO_APPLICATION) private readonly contactoApplication: IContactoAplication,
        @Inject(TIPO_CONTACTO_APPLICATION) private readonly tipoContactoApplication: ITipoContactoAplication
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

    @Delete(':id')
    @Permissions( 'CNT_CREATE', 'SYS_ADMIN')
    async deleteContacto(@Param('id') id: string): Promise<void> {
        Logger.warn(`Deleting contact with id: ${id}`);
        return this.contactoApplication.delete(id);
    }



}