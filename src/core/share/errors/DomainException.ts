import { InsertError } from "./Insert.error";

export const errorMessages: { [key: string]: string } = {
    USER_NOT_FOUND: "UserNotFound",
    INVALID_PASSWORD: "InvalidPassword",
    // ...otros errores
};

export class DomainException extends Error {
     __proto__ = Error;

    constructor(message: string, name: string = 'DomainException') {
        super(message)
        this.message = message
        Object.setPrototypeOf(this, DomainException.prototype);
    }
}