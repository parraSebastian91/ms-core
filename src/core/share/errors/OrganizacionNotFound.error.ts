
export class OrgNotFoundError extends Error {
     __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, OrgNotFoundError.prototype);
    }
}