export const MESSAGE_PUBLISHER = 'MESSAGE_PUBLISHER';

export interface IMessagePublisher {
    publish(pattern: string, payload: unknown): Promise<void>;
}
