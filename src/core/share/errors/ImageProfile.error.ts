
export class ImageProfileError extends Error {
     __proto__ = Error;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ImageProfileError.prototype);
    }
}