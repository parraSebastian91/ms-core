/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Inject, Param, Query, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { IUserProfileAdministratorUseCase } from 'src/core/domain/puertos/inbound/IUserAdministrator.interface';

@Controller("usuario")
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

        return res.status(200).json(userProfile);
    }
    
}
