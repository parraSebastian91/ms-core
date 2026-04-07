/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, HttpStatus, Inject, Param, Query, Res, UseFilters } from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { IUserProfileAdministratorUseCase } from 'src/core/domain/puertos/inbound/IUserAdministrator.interface';
import { ApiResponse } from '../model/api-response.model';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { UserProfileDTO } from '../model/dto/userProfile.response.dto';

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
        console.log(systemNavigation);
        return res.status(200).json(new ApiResponse(HttpStatus.OK, "Extraccio exitosa", systemNavigation));
    }



}
