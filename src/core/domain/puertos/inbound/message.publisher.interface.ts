export const MESSAGE_PUBLISHER = 'MESSAGE_PUBLISHER';

export interface IMessagePublisher {
    publish(
        exchange: string,
        routingKey: string,
        payload: unknown,
        options?: {
            persistent?: boolean;
            headers?: Record<string, unknown>;
            exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
        }
    ): Promise<void>;
}
