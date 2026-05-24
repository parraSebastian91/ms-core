export interface IPermisosManagerService {
    GrantAccess_WorkTeam(resourceId: string, workTeamID: string, permissions: string[]): Promise<boolean>;
    GrantAccess_Organization(tipoRecurso: string, resourceId: string, userGrante: string, organizacionID: string, permissions: string[], razon_descripcion: string): Promise<number>;
}