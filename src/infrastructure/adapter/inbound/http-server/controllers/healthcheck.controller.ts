/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller('health')
@Public()
export class HealthcheckController {

    private readonly logger = new Logger(HealthcheckController.name);

    @Get()
    healthCheck() {
        this.logger.log('Health check endpoint called');
        return {
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
        };
    }

    @Get('live')
    liveness() {
        return { status: 'alive' };
    }

    @Get('ready')
    readiness() {
        return { status: 'ready' };
    }
}