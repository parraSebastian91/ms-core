export class OrganizacionModel {

    organizacionUuid: string;
    razonSocial: string
    tipoOrganizacion: string;
    formatoRut: string;
    rut: string;
    rutDv: string;
    tipoParticipante: string;

    constructor() {
        this.organizacionUuid = "";
        this.razonSocial = "";
        this.tipoOrganizacion = "";
        this.formatoRut = "";
        this.rut = "";
        this.rutDv = "";
        this.tipoParticipante = "";
    }

    static fromQuery(raw: any[]): OrganizacionModel[] {
        return raw.map((item: any) => {
            const model = new OrganizacionModel();
            model.organizacionUuid = item.organizacion_uuid;
            model.razonSocial = item.razon_social;
            model.tipoOrganizacion = item.tipo_organizacion;
            model.formatoRut = item.formato_rut;
            model.rut = item.rut;
            model.rutDv = item.rut_dv;
            model.tipoParticipante = item.tipo_participante;
            return model;
        });
    }
}