export class PermisoError extends Error {

    __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PermisoError.prototype);
    }
}