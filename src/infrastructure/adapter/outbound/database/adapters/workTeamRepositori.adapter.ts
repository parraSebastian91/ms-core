import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { WorkTeamModel } from "src/core/domain/model/workTeam.model";
import { IWorkTeamRepository } from "src/core/domain/puertos/outbound/IWorkTeam.rerpository";
import { DataSource } from "typeorm";

export class WorkTeamRepositoryAdapter implements IWorkTeamRepository {
    private readonly logger = new Logger(WorkTeamRepositoryAdapter.name);
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    async createWorkTeam(workTeam: WorkTeamModel): Promise<WorkTeamModel> {
        this.logger.debug(`Creando equipo de trabajo: ${JSON.stringify(workTeam)}`);
        return Promise.resolve(workTeam);
    }

    async getWorkTeamsByOrganization(organizationId: string): Promise<WorkTeamModel[]> {
        throw new Error("Method not implemented.");
    }

    async getWorkTeamsByUserUuid(userUuid: string): Promise<WorkTeamModel[]> {
        this.logger.debug(`Obteniendo equipos de trabajo para usuario UUID: ${userUuid}`);

        const configuredSchema = "work_team";
        const schema = configuredSchema.replace(/"/g, '""');
        return [];
    }


    getWorkTeamById(workTeamId: string): Promise<WorkTeamModel> {
        this.logger.debug(`Obteniendo equipo de trabajo por ID: ${workTeamId}`);
        return Promise.resolve(new WorkTeamModel());
    }

    async isLeaderOfWorkTeam(usuario: string, workTeamId: string): Promise<boolean> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario);
        this.logger.debug(`Verificando si el usuario UUID: ${usuario} es líder del equipo de trabajo ID: ${workTeamId}`);

        const configuredSchema = "core";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `
        SELECT COUNT(*) > 0 AS is_leader
        FROM 
        ${schema}.usuario u
        JOIN ${schema}.grupo_trabajo gt on u.usuario_uuid = gt.lider_usuario_uuid 
        where ${isUUID ? 'u.usuario_uuid' : 'u.username'} = $1  and gt.organizacion_id = $2 and gt.activo = true 
        `;

        const values: any[] = [usuario, workTeamId];

        try {
            const result = await this.dataSource.query(query, values);
            this.logger.debug(`Resultado de la verificación de líder: ${JSON.stringify(result)}`);
            return result[0]?.is_leader ?? false;
        } catch (error: any) {
            this.logger.error(
                `Error al verificar si el usuario es líder del equipo de trabajo: ${error?.message ?? error}`,
                `usuario: ${usuario}, equipo de trabajo: ${workTeamId}`,
                error?.stack,
            );
            return false;
        }
    }
}