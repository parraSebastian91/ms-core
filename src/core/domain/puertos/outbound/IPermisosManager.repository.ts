export interface IPermisosManagerRepository {
    GrantAccess_Organization(tipoRecurso: string, resourceId: string, userGrante: string, organizacionID: string, permissions: string[], razon_descripcion: string): Promise<number>;
    GrantAccess_user(tipoRecurso: string, resourceId: string, userGrante: string, userGrantTo: string, permissions: string[], razon_descripcion: string): Promise<number>;
    RevokeAccess_Organization(tipoRecurso: string, resourceId: string, organizacionID: string, permissions: string[]): Promise<number>;
}