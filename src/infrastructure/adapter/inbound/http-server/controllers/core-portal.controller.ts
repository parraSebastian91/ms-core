/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get } from '@nestjs/common';

@Controller("core")
export class CorePortalController { 


    @Get("sistema")
    async getMenu() {

    }


}
