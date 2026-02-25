import { UsuarioEntity } from "src/infrastructure/database/entities/usuario.entity";
import { UsuarioModel } from "../../model/usuario.model";

export interface IUsuarioRepository {
    getValidId(): Promise<number> ;
    getAllUsuarios(): Promise<UsuarioEntity[]>;
    getUsuarioById(uuid: string): Promise<UsuarioModel>;
    getUsuarioByUsername(username: string): Promise<UsuarioEntity>;
    createUsuario(data: UsuarioEntity): Promise<UsuarioEntity>;
    updateUsuario(id: number, data: UsuarioEntity): Promise<UsuarioEntity>;
    deleteUsuario(id: number): Promise<void>;
}