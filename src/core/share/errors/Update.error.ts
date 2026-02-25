
export class UpdateError extends Error {
     __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UpdateError.prototype);
    }
}