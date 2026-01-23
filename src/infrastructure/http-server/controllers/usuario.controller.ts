import { Body, Controller, Get, Inject, Param, Post, UseFilters, HttpCode } from "@nestjs/common";
import { UsuarioModel } from "../../../core/domain/model/usuario.model";
import { USUARIO_APPLICATION } from "src/core/core.module";
import { ValidationPipe } from "../pipes/validation.pipe";
import { UsuarioDTO } from "../model/dto/usuario.dto";
import { CoreExceptionFilter } from "src/infrastructure/exceptionFileter/contacto.filter";
import { IUsuarioAplication } from "src/core/aplication/usuario/iUsuarioAplication.interface";
import { Roles } from "../decorators/roles.decorator";
import { Permissions } from "../decorators/permissions.decorator";
import { CurrentUser, CurrentUserData } from "../decorators/current-user.decorator";

import { ApiResponse } from '../model/api-response.model';


@Controller('usuario')
@UseFilters(CoreExceptionFilter)
export class UsuarioController {

    constructor( @Inject(USUARIO_APPLICATION) private usuarioApplication: IUsuarioAplication) {}


    @Post()
    @HttpCode(201)
    @Permissions('USR_CREATE', 'SYS_ADMIN') // Múltiples formas de crear usuario
    async createUsuario(@Body(new ValidationPipe()) data: UsuarioDTO): Promise<ApiResponse<UsuarioModel>> {
        const usuario = await this.usuarioApplication.create(data);
        return new ApiResponse(201, 'Usuario creado correctamente', usuario);
    }

    @Get()
    @Permissions('USR_VIEW', 'SYS_ADMIN') // Diferentes niveles de acceso para listar
    async getAllUsuarios(): Promise<ApiResponse<UsuarioModel[]>> {
        const usuarios = await this.usuarioApplication.findAll();
        return new ApiResponse(200, 'Lista de usuarios', usuarios);
    }

    @Get('/username/:username')
    @Permissions('USR_VIEW', 'SYS_ADMIN') // Múltiples permisos - necesita al menos uno
    async getUsuarioByUsername(@Param('username') username: string): Promise<ApiResponse<UsuarioModel>> {
        const usuario = await this.usuarioApplication.findByUsername(username);
        return new ApiResponse(200, 'Usuario encontrado', usuario);
    }

    @Get('/id/:id')
    @Permissions('USR_VIEW', 'SYS_ADMIN') // Múltiples permisos - necesita al menos uno
    async getUsuarioById(@Param('id') id: string): Promise<ApiResponse<UsuarioModel>> {
        const usuario = await this.usuarioApplication.findById(id);
        return new ApiResponse(200, 'Usuario encontrado', usuario);
    }

    @Get('/me')
    // Solo autenticación requerida, sin roles específicos
    async getCurrentUser(@CurrentUser() user: CurrentUserData): Promise<ApiResponse<UsuarioModel>> {
        const usuario = await this.usuarioApplication.findById(user.userId);
        return new ApiResponse(200, 'Usuario actual', usuario);
    }

    @Get('/profile')
    async getUserProfile(@CurrentUser() user: CurrentUserData): Promise<ApiResponse<any>> {
        const usuario = await this.usuarioApplication.findById(user.userId);
        return new ApiResponse(200, 'Perfil del usuario', {
            usuario,
            userInfo: {
                userId: user.userId,
                username: user.username,
                roles: user.roles,
                permissions: user.permissions
            }
        });
    }

    // Método para actualizar usuario - requiere permiso específico
    @Permissions('USR_EDIT', 'USR_UPDATE', 'usuario.editar') // Múltiples permisos de edición
    updateUsuario(id: string, data: UsuarioModel): Promise<UsuarioModel> {
        throw new Error("Method not implemented.");
    }

    // Método para eliminar usuario - combina roles y múltiples permisos
    @Permissions('USR_DELETE', 'usuario.eliminar', 'SUPER_ADMIN') // Múltiples permisos de eliminación
    @Roles('admin', 'superuser') // Y además debe tener uno de estos roles
    deleteUsuario(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // Ejemplo de método con permisos muy específicos
    @Get('/sensitive-data')
    @Permissions(
        'USR_VIEW_SENSITIVE',     // Permiso específico para datos sensibles
        'AUDIT_READ',             // Permiso de auditoría
        'SUPER_ADMIN',            // Permiso de super admin
        'SECURITY_OFFICER'        // Permiso de oficial de seguridad
    )
    async getSensitiveUserData(@CurrentUser() user: CurrentUserData): Promise<ApiResponse<any>> {
        // El usuario necesita tener AL MENOS UNO de los permisos especificados arriba
        return new ApiResponse(200, 'Datos sensibles', {
            message: 'Usuario tiene permisos para ver datos sensibles',
            userPermissions: user.permissions
        });
    }
    

}