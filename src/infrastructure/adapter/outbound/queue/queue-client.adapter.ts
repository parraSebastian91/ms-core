import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { inspect } from 'node:util';
import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { IMessagePublisher } from 'src/core/domain/puertos/inbound/message.publisher.interface';

@Injectable()
export class QueueClientAdapter implements IMessagePublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueClientAdapter.name);
  private connected = false;

  private amqpConn?: ChannelModel;
  private amqpChannel?: Channel;
  private amqpUrl = '';
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit(): Promise<void> {
    await this.connectClientProxy();
    await this.initAmqp();
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

    if (!this.amqpChannel) {
      this.logger.warn(
        `[WARN] Canal AMQP no disponible — saltando publicación | exchange=${exchange} | routingKey=${routingKey}. El mensaje no fue encolado.`
      );
      return;
    }

    try {
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

  private async initAmqp(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[START] Conectando AMQP directo');
    try {
      const host = this.configService.get<string>('rabbitmq.host') || 'rabbitmq';
      const port = this.configService.get<number>('rabbitmq.port') || 5672;
      const user = this.configService.get<string>('rabbitmq.user') || 'core';
      const pass = this.configService.get<string>('rabbitmq.pass') || 'core-123';
      this.amqpUrl = `amqp://${user}:${pass}@${host}:${port}`;
      this.amqpConn = await connect(this.amqpUrl);
      this.amqpChannel = await this.amqpConn.createChannel();
      this.amqpConn.on('error', (err) => {
        this.logger.warn(`[WARN] Conexión AMQP caida | reason=${err.message}`);
        this.amqpChannel = undefined;
        this.amqpConn = undefined;
      });
      this.logger.log(`[OK] AMQP conectado | durationMs=${Date.now() - startedAt}`);
    } catch (error: unknown) {
      this.logger.warn(
        `[WARN] No se pudo conectar AMQP | durationMs=${Date.now() - startedAt} | reason=${this.formatError(error)}. Las notificaciones de cola estarán deshabilitadas.`
      );
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return inspect(error, { depth: 5, breakLength: 120 });
  }
}