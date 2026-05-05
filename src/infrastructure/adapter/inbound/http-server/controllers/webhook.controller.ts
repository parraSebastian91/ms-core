/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Put, Res } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller("webhooks")
@Public()
export class WebhookController { 

    @Put("notify")
    handleWebhook(
        @Body() payload: any,
        @Res() response: Response
    ) {
        // Lógica para manejar el webhook
    }

}
