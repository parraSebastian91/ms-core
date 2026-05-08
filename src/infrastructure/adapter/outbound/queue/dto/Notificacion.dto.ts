export class NotificacionDTO<T> {
    eventType: string;
    ownerUUID: string;
    gestor: string;
    correlationId: string;
    message: MessageDTO;
    data: T;
    constructor(
        eventType: string, 
        ownerUUID: string, 
        gestor: string, 
        correlationId: string, 
        message: MessageDTO, 
        data: T
    ) {
        this.eventType = eventType;
        this.ownerUUID = ownerUUID;
        this.gestor = gestor;
        this.correlationId = correlationId;
        this.message = message;
        this.data = data;
    }
}

export class MessageDTO {
    error: boolean;
    code: string;
    description: string;
    constructor(code: string, description: string, error: boolean = false) {
        this.code = code;
        this.description = description;
        this.error = error;
    }
}


