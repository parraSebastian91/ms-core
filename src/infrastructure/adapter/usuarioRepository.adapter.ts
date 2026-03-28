import { InjectRepository } from "@nestjs/typeorm";
import { UsuarioEntity } from "../database/entities/usuario.entity";
import { Repository } from "typeorm";
import { IUsuarioRepository } from "../../core/domain/puertos/outbound/iUsuarioRepository.interface";
import { Injectable } from "@nestjs/common";
import { UsuarioModel } from "src/core/domain/model/usuario.model";

@Injectable()
export class UsuarioRepositoryAdapter implements IUsuarioRepository {
    constructor(
        @InjectRepository(UsuarioEntity) private readonly usuarioRepository: Repository<UsuarioEntity>,
    ) {}

    getValidId(): Promise<number> {
        return this.usuarioRepository.count().then(count => count + 1);
    }

    getAllUsuarios(): Promise<UsuarioEntity[]> {
        return this.usuarioRepository.find({
            relations: ['rol', 'contacto', 'contacto.tipoContacto'],
        });
    }
    
    async getUsuarioById(uuid: string): Promise<UsuarioModel> {
        const usuarioEntity = await this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoinAndSelect('usuario.rol', 'rol')
            .leftJoinAndSelect('usuario.contacto', 'contacto')
            .leftJoinAndSelect('contacto.tipoContacto', 'tipoContacto')
            .leftJoinAndSelect('rol.permisos', 'permisos', 'permisos.activo = :activo', { activo: true })
            .where('usuario.uuid = :uuid', { uuid })
            .getOne();
        return UsuarioModel.create(usuarioEntity);
    }

    async getUsuarioByUsername(username: string): Promise<UsuarioEntity> {
        const usuario = await this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoinAndSelect('usuario.rol', 'rol')
            .leftJoinAndSelect('usuario.contacto', 'contacto')
            .leftJoinAndSelect('contacto.tipoContacto', 'tipoContacto')
            .leftJoinAndSelect('rol.permisos', 'permisos', 'permisos.activo = :activo', { activo: true })
            .where('usuario.userName = :username', { username })
            .getOne();
        return usuario;
    }

    createUsuario(data: UsuarioEntity): Promise<UsuarioEntity> {
        const newUsuario = this.usuarioRepository.create(data);
        return this.usuarioRepository.save(newUsuario);
    }
    updateUsuario(id: number, data: UsuarioEntity): Promise<UsuarioEntity> {
        return this.usuarioRepository.save({ ...data, id });
    }
    deleteUsuario(id: number): Promise<void> {
        return this.usuarioRepository.delete(id).then(() => {});
    }
      
}