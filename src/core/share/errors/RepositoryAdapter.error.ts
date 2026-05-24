export class RepositoryAdapterError extends Error {
    __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, RepositoryAdapterError.prototype);
    }
}