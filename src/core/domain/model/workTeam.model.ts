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

export class WorkTeamSimpleModel {
    grupoId: string;
    nombreGrupo: string;
    organizacionUuid: string;
    razonSocial: string;
    tipoParticipante: string;

    constructor() {
        this.grupoId = "";
        this.nombreGrupo = "";
        this.organizacionUuid = "";
        this.razonSocial = "";
        this.tipoParticipante = "";
    }
    static fromQuery(raw: any[]): WorkTeamSimpleModel[] {
        return raw.map((item: any) => {
            const model = new WorkTeamSimpleModel();
            model.grupoId = item.grupo_id;
            model.nombreGrupo = item.nombre_grupo;
            model.organizacionUuid = item.organizacion_uuid;
            model.razonSocial = item.razon_social;
            model.tipoParticipante = item.tipo_participante;
            return model;
        });
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