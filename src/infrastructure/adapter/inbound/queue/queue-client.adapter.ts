/*
https://docs.nestjs.com/providers#services
*/

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IMessagePublisher } from 'src/core/domain/puertos/inbound/message.publisher.interface';
@Injectable()
export class QueueClientAdapter implements IMessagePublisher, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(QueueClientAdapter.name);

	constructor(@Inject('OBJECT_SERVICE') private readonly client: ClientProxy) { }

	async onModuleInit(): Promise<void> {
		this.logger.log('[START] Conectando cliente de cola');
		const startedAt = Date.now();
		await this.client.connect();
		this.logger.log(`[OK] Cliente de cola conectado | durationMs=${Date.now() - startedAt}`);
	}

	async onModuleDestroy(): Promise<void> {
		this.logger.log('[START] Cerrando cliente de cola');
		const startedAt = Date.now();
		await this.client.close();
		this.logger.log(`[OK] Cliente de cola cerrado | durationMs=${Date.now() - startedAt}`);
	}

	async publish(pattern: string, payload: unknown): Promise<void> {
		const startedAt = Date.now();
		this.logger.log(`[START] Publicar evento | pattern=${pattern}`);
		try {
			await firstValueFrom(this.client.emit(pattern, payload));
			this.logger.log(`[OK] Evento publicado | pattern=${pattern} | durationMs=${Date.now() - startedAt}`);
		} catch (error: any) {
			this.logger.error(`[FAIL] Publicar evento | pattern=${pattern} | durationMs=${Date.now() - startedAt} | reason=${error?.message ?? error}`);
			throw error;
		}
	}
}