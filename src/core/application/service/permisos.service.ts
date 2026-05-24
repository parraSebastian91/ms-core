import { Injectable } from "@nestjs/common";
import { FacturaModel } from "src/core/domain/model/factura.model";
import { IPermisosManagerService } from "src/core/domain/puertos/inbound/IPermisosManagerService.interface";
import { IPermisosManagerRepository } from "src/core/domain/puertos/outbound/IPermisosManager.repository";
import { IWorkTeamRepository } from "src/core/domain/puertos/outbound/IWorkTeam.rerpository";

@Injectable()
export class PermisosService implements IPermisosManagerService {

    constructor(
        private readonly workTeamRepository: IWorkTeamRepository,
        private readonly permisosManagerRepository: IPermisosManagerRepository
    ) { }
    GrantAccess_WorkTeam(resourceId: string, workTeamID: string, permissions: string[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async GrantWorkTeamAccess(resourceId: string, workTeamID: string, permissions: string[]): Promise<boolean> {
        return false;
    }

    async GrantAccess_Organization(tipoRecurso: string, resourceId: string, userGrante: string, organizacionID: string, permissions: string[], razon_descripcion: string): Promise<number> {
        return this.permisosManagerRepository.GrantAccess_Organization(tipoRecurso, resourceId, userGrante, organizacionID, permissions, razon_descripcion);
    }


    
}