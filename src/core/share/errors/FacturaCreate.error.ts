export class FacturaCreateError extends Error {

    __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, FacturaCreateError.prototype);
    }
}