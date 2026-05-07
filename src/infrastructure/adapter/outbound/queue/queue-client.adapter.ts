import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { inspect } from 'node:util';
import { connect, Channel, Connection } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { IMessagePublisher } from 'src/core/domain/puertos/inbound/message.publisher.interface';

@Injectable()
export class QueueClientAdapter implements IMessagePublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueClientAdapter.name);
  private connected = false;

  private amqpConn?: Connection;
  private amqpChannel?: Channel;
  private amqpUrl = '';

  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit(): Promise<void> {
    await this.connectClientProxy();
    await this.connectAmqp();
  }

  async onModuleDestroy(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[START] Cerrando clientes de cola');
    try {
      await this.client.close();
      await this.amqpChannel?.close();
      await this.amqpConn?.close();
      this.connected = false;
      this.logger.log(`[OK] Clientes cerrados | durationMs=${Date.now() - startedAt}`);
    } catch (error: unknown) {
      this.logger.warn(
        `[WARN] Error al cerrar clientes | durationMs=${Date.now() - startedAt} | reason=${this.formatError(error)}`,
      );
    }
  }

  async publish(exchange: string, routingKey: string, payload: unknown, options?: { persistent?: boolean; headers?: Record<string, unknown>; exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers'; }): Promise<void> {
    const startedAt = Date.now();
    this.logger.log(`[START] Publicar Rabbit | exchange=${exchange} | routingKey=${routingKey}`);

    try {
      if (!this.amqpChannel) {
        await this.connectAmqp();
      }
      if (!this.amqpChannel) {
        throw new Error('Canal AMQP no disponible');
      }

      const exchangeType = options?.exchangeType ?? 'topic';
      await this.amqpChannel.assertExchange(exchange, exchangeType, { durable: true });

      
      const packet = {
        pattern: routingKey,
        data: payload,
      }
      
      const body = Buffer.from(JSON.stringify(packet));

      const ok = this.amqpChannel.publish(exchange, routingKey, body, {
        persistent: options?.persistent ?? true,
        contentType: 'application/json',
        headers: options?.headers ?? {},
      });

      if (!ok) {
        this.logger.warn(
          `[WARN] Backpressure al publicar | exchange=${exchange} | routingKey=${routingKey}`,
        );
      }

      this.logger.log(
        `[OK] Evento Rabbit publicado | exchange=${exchange} | routingKey=${routingKey} | durationMs=${Date.now() - startedAt}`,
      );
    } catch (error: unknown) {
      const reason = this.formatError(error);
      this.logger.error(
        `[FAIL] Evento Rabbit | exchange=${exchange} | routingKey=${routingKey} | durationMs=${Date.now() - startedAt} | reason=${reason}`,
      );
      throw new Error(
        `No se pudo publicar en Rabbit. exchange=${exchange} routingKey=${routingKey}. reason=${reason}`,
      );
    }
  }
  private async connectClientProxy(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[START] Conectando ClientProxy');
    try {
      await this.client.connect();
      this.connected = true;
      this.logger.log(`[OK] ClientProxy conectado | durationMs=${Date.now() - startedAt}`);
    } catch (error: unknown) {
      this.connected = false;
      throw new Error(`Error conectando ClientProxy: ${this.formatError(error)}`);
    }
  }

  private async connectAmqp(): Promise<void> {
    const startedAt = Date.now();
    const host = this.configService.get<string>('rabbitmq.host') || 'rabbitmq';
    const port = this.configService.get<number>('rabbitmq.port') || 5672;
    const user = this.configService.get<string>('rabbitmq.user') || 'core';
    const pass = this.configService.get<string>('rabbitmq.pass') || 'core-123';

    this.amqpUrl = `amqp://${user}:${pass}@${host}:${port}`;

    this.logger.log('[START] Conectando AMQP nativo');
    try {
      this.amqpConn = await connect(this.amqpUrl);
      this.amqpChannel = await this.amqpConn.createChannel();
      this.logger.log(`[OK] AMQP nativo conectado | durationMs=${Date.now() - startedAt}`);
    } catch (error: unknown) {
      this.amqpChannel = undefined;
      this.amqpConn = undefined;
      throw new Error(`Error conectando AMQP nativo: ${this.formatError(error)}`);
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return inspect(error, { depth: 5, breakLength: 120 });
  }
}