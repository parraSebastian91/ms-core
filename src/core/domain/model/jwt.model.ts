

export interface AccessTokenPayload {
    userId: number;
    userName: string;
    userUuid: string;
    sessionUuid: string;
    sessionId: string;
    roles: string[];
    permissions: string[];
    typeDevice: string;
}