export class WorkTeamModel {
    id: string;
    name: string;
    descripcion: string;
    liderUuid: string;
    organizationId: string;
    members: WorkTeamMemberModel[];
    active: boolean;
    metadata: Record<string, any>;

    constructor() {
        this.id = "";
        this.name = "";
        this.descripcion = "";
        this.liderUuid = "";
        this.organizationId = "";
        this.members = [];
        this.active = true;
        this.metadata = {};
    }

}

export class WorkTeamMemberModel {
    id: string;
    workTeamId: string;
    userUuid: string;
    LiderUuid: string;
    Cargo: string;
    active: boolean;
    constructor() {
        this.id = "";
        this.workTeamId = "";
        this.userUuid = "";
        this.LiderUuid = "";
        this.Cargo = "";
        this.active = true;
    }
}