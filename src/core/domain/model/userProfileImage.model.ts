
const USER_AVATAR_CATEGORY = "user-avatar";
const USER_BANNER_CATEGORY = "user-banner";


class ProfileImageMetadata {
    size: string;
    width: number;
    format: string;
    height: number;
    headers: string;
    constructor() {
        this.size = "";
        this.width = 0;
        this.format = "";
        this.height = 0;
        this.headers = "";
    }
}

export class ProfileImageModel {
    category: string;
    path: string;
    metadata: ProfileImageMetadata;

    constructor() {
        this.category = "";
        this.path = "";
        this.metadata = new ProfileImageMetadata();
    }

}