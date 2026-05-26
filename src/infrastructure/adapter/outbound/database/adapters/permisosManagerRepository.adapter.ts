import { Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { IPermisosManagerRepository } from "src/core/domain/puertos/outbound/IPermisosManager.repository";
import { RepositoryAdapterError } from "src/core/share/errors/RepositoryAdapter.error";
import { DataSource } from "typeorm";

export class PermisosRepositoryAdapter implements IPermisosManagerRepository {
    private readonly logger = new Logger(PermisosRepositoryAdapter.name);
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }

    async GrantAccess_Organization(tipoRecurso: string, resourceId: string, userGrante: string, organizacionID: string, permissions: string[], razon_descripcion: string): Promise<number> {
        const query = `
        SELECT permisos.grant_access_to_organization_groups(
            $1::TEXT,
            $2::UUID,
            $3::UUID,
            $4::UUID,
            $5::TEXT,
            $6::TEXT
        );`;
       try {
        const result = await this.dataSource.query(query, [tipoRecurso, resourceId, organizacionID, userGrante, permissions.join(","), razon_descripcion]);
        this.logger.debug(`GrantAccess_Organization result: ${JSON.stringify(result)}`);
        return result[0].grant_access_to_organization_groups;
       } catch (error) {
        this.logger.error("Error executing GrantAccess_Organization:", error);
        throw new RepositoryAdapterError("Error executing GrantAccess_Organization");
       }
    }

    async GrantAccess_user(tipoRecurso: string, resourceId: string, userGrante: string, userGrantTo: string, permissions: string[], razon_descripcion: string): Promise<number> {
        return 0;
    }


}