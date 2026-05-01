/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Get, HttpStatus, Inject, Param, Put, Query, Res, UseFilters } from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { IUserProfileAdministratorUseCase } from 'src/core/domain/puertos/inbound/IUserAdministrator.interface';
import { ApiResponse } from '../model/api-response.model';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { UserProfileDTO } from '../model/dto/userProfile.response.dto';
import { UserProfileReqResDTO } from '../model/dto/userProfile.request.dto';
import { UserOrganizacionProfileDTO } from '../model/dto/UserOrganizacionProfile.dto';

@Controller("usuario")
@UseFilters(CoreExceptionFilter)
export class UserProfileController {

    constructor(
        @Inject("USER_PROFILE_USE_CASE") private userProfileUseCase: IUserProfileAdministratorUseCase
    ) { }

    @Get("profile/:uuid")
    @Roles("SUPER_ADMIN")
    @Permissions("USR_VIEW")
    async getUserProfile(
        @Param("uuid") uuid: string,
        @Res() res: Response
    ) {
        const userProfile = await this.userProfileUseCase.ExecuteGetUserProfile({ uuid });
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccio exitosa", UserProfileDTO.builder(userProfile)));
    }

    @Get("profile/navigation/:uuid")
    @Roles("SUPER_ADMIN")
    @Permissions("USR_VIEW")
    async getUserProfileNavigation(
        @Param("uuid") uuid: string,
        @Res() res: Response
    ) {
        const systemNavigation = await this.userProfileUseCase.ExecuteGetSystemNavigation(uuid);
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccion exitosa", systemNavigation));
    }

    @Get("profile/image/:uuid")
    @Roles("SUPER_ADMIN")
    @Permissions("USR_VIEW")
    async getUserProfileImage(
        @Param("uuid") uuid: string,
        @Res() res: Response
    ) {
        const userProfileImage = await this.userProfileUseCase.ExecuteGetUserProfileImage(uuid);
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccion exitosa", userProfileImage));
    }

    @Put("profile/:uuid")
    @Roles("SUPER_ADMIN")
    @Permissions("USR_VIEW")
    async updateUserProfileImage(
        @Body() body: any,
        @Param("uuid") uuid: string,
        @Res() res: Response
    ) {
        const userProfifleModel = UserProfileReqResDTO.toModel(body);
        const updateResult = await this.userProfileUseCase.ExecuteUpdateUserProfile(uuid, userProfifleModel);
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccion exitosa", updateResult));
    }

    @Get("profile/organization/:uuid")
    @Roles("SUPER_ADMIN")
    @Permissions("USR_VIEW")
    async getUserOrganizacionProfile(
        @Param("uuid") uuid: string,
        @Res() res: Response
    ) {
        const userOrganizacionProfile = await this.userProfileUseCase.ExecuteGetUserOrganizacionByUsuario(uuid);
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccion exitosa", UserOrganizacionProfileDTO.fromModelArray(userOrganizacionProfile)));
    }




}
