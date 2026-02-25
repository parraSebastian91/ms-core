import { ContactoEntity } from "src/infrastructure/database/entities/contacto.entity";
import { ContactoModel } from "../../model/contacto.model";

export interface IContactoRepository  {
    findById(id: number): Promise<ContactoModel | null>;
    findByUsername(username: string): Promise<ContactoModel | null>;
    findAll(): Promise<ContactoModel[] | null>;
    create(data: ContactoEntity): Promise<ContactoModel>;
    update(id: number, data: ContactoEntity): Promise<ContactoModel>;
    delete(id: number): Promise<void>;
    findContactoByUserUUID(uuid: string): Promise<ContactoModel | null>
}