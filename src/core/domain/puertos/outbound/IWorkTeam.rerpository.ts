import { WorkTeamModel } from "../../model/workTeam.model";

export interface IWorkTeamRepository {
    // Aquí irían los métodos que el repositorio de equipos de trabajo debe implementar
    // Por ejemplo:
    createWorkTeam(workTeam: WorkTeamModel): Promise<WorkTeamModel>;
    getWorkTeamsByOrganization(organizationId: string): Promise<WorkTeamModel[]>;
    getWorkTeamById(workTeamId: string): Promise<WorkTeamModel>;
    getWorkTeamsByUserUuid(userUuid: string): Promise<WorkTeamModel[]>
    /**
     * 
     * @param usuario puede ser tanto uuid com userName
     * @param workTeamId 
     */
    isLeaderOfWorkTeam(usuario: string, workTeamId: string): Promise<boolean>;
    // updateWorkTeam(workTeamId: string, workTeam: WorkTeamModel): Promise<WorkTeamModel>;
    // deleteWorkTeam(workTeamId: string): Promise<void>;
}