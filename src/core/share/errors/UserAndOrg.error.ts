export class UserAndOrgError extends Error {

    __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UserAndOrgError.prototype);
    }
}