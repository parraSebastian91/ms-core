import { ProfileImageModel } from "src/core/domain/model/userProfileImage.model";
import { ImageProfileError } from "src/core/share/errors/ImageProfile.error";


class ProfileImageMetadata {
    size: string;
    width: number;
    format: string;
    height: number;
    headers: string;
}

export class ProfileImageQueryResponse {
    category: string;
    path: string;
    metadata: ProfileImageMetadata;

    static toDomainModel(queryResult: ProfileImageQueryResponse[]): ProfileImageModel[] {
        return queryResult.map(result => {
            const metadata = new ProfileImageMetadata();
            metadata.size = result.metadata.size
            metadata.width = result.metadata.width;
            metadata.format = result.metadata.format;
            metadata.height = result.metadata.height;
            metadata.headers = result.metadata.headers?.toString() || "";
            const userProfileImage = new ProfileImageModel();
            userProfileImage.category = result.category;
            userProfileImage.path = result.path;
            userProfileImage.metadata = metadata;
            return userProfileImage;
        });
    }
}