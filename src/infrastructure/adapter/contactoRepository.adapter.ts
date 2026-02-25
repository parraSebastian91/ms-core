import { In, Repository } from "typeorm";

import { ContactoEntity } from "../database/entities/contacto.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IContactoRepository } from "src/core/domain/puertos/outbound/iContactoRepository.interface";
import { ContactoModel } from "src/core/domain/model/contacto.model";


export class ContactoRepositoryAdapter implements IContactoRepository {

    constructor(@InjectRepository(ContactoEntity) private contactoRepository: Repository<ContactoEntity>) {
    }

    findById(id: number): Promise<ContactoModel | null> {
        return this.contactoRepository.findOne({
            where: { id },
            relations: ["tipoContacto"]
        }).then((contacto) => contacto ? ContactoModel.create(contacto) : null);
    }
    findAll(): Promise<ContactoModel[] | null> {
        return this.contactoRepository.find({
            relations:["tipoContacto"]
        }).then((contactos) => contactos.map(ContactoModel.create));
    }
    create(data: ContactoEntity): Promise<ContactoModel> {
        return this.contactoRepository.save(data).then(ContactoModel.create);
    }

    update(id: number, data: ContactoEntity): Promise<ContactoModel> {
        return this.contactoRepository.update(id, data)
            .then(() => this.contactoRepository.findOne({ where: { id }, relations: ["tipoContacto"] }))
            .then((contacto) => {
                if (!contacto) {
                    throw new Error(`Contacto with id ${id} not found`);
                }
                return ContactoModel.create(contacto);
            });
    }

    delete(id: number): Promise<void> {
        return this.contactoRepository.delete(id)
            .then((result) => {
                if (result.affected === 0) {
                    throw new Error(`Contacto with id ${id} not found`);
                }
            });
    }

    async findByUsername(username: string): Promise<ContactoModel | null> {
        const contacto = await this.contactoRepository.findOne({
            where: { usuario: { userName: username } },
            relations: ["tipoContacto", "usuario"]
        });
        return contacto ? ContactoModel.create(contacto) : null;
    }

    async findContactoByUserUUID(uuid: string): Promise<ContactoModel | null> {

        const contacto = await this.contactoRepository
        .createQueryBuilder('contacto')
        .leftJoinAndSelect('contacto.usuario', 'usuario')
        .where('usuario.uuid = :uuid', { uuid })
        .leftJoinAndSelect('contacto.tipoContacto', 'tipoContacto')
        .leftJoinAndSelect('contacto.usuario', 'usuario')
        .getOne();

        return contacto ? ContactoModel.create(contacto) : null;
    }



    
    
}