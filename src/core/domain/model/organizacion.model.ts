import { GiroComercial } from "src/infrastructure/adapter/inbound/http-server/model/dto/organizacion.dto";

export class OrganizacionModel {
    organizacionId: number;
    organizacionUuid: string;
    razonSocial: string
    tipoOrganizacion: string;
    formatoRut: string;
    rut: string;
    rutDv: string;
    tipoParticipante: string;
    giros?: GiroComercialModel[];

    constructor() {
        this.organizacionId = -1;
        this.organizacionUuid = "";
        this.razonSocial = "";
        this.tipoOrganizacion = "";
        this.formatoRut = "";
        this.rut = "";
        this.rutDv = "";
        this.tipoParticipante = "";
    }

    getGiroPrincipal(): string | null {
        if (!this.giros || this.giros.length === 0) {
            return null;
        }
        const principal = this.giros.find(g => g.esPrincipal);
        return principal ? principal.descripcion : null;
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
            model.giros = item.giros;
            return model;
        });
    }

    static build(): OrganizacionModel.Builder {
        return new OrganizacionModel.Builder();
    }
}

export namespace OrganizacionModel {
    export class Builder {
        private readonly model: OrganizacionModel;

        constructor() {
            this.model = new OrganizacionModel();
        }

        setOrganizacionId(value: number): this {
            this.model.organizacionId = Number(value);
            return this;
        }

        setOrganizacionUuid(value: string): this {
            this.model.organizacionUuid = value;
            return this;
        }

        setRazonSocial(value: string): this {
            this.model.razonSocial = value;
            return this;
        }

        setTipoOrganizacion(value: string): this {
            this.model.tipoOrganizacion = value;
            return this;
        }

        setFormatoRut(value: string): this {
            this.model.formatoRut = value;
            const raw = value.replace(/\./g, '');
            const dashIdx = raw.lastIndexOf('-');
            const rutNum = dashIdx >= 0 ? raw.slice(0, dashIdx) : raw;
            const dv = dashIdx >= 0 ? raw.slice(dashIdx + 1).toUpperCase() : '';
            this.model.rut = rutNum;
            this.model.rutDv = dv;
            return this;
        }

        setRut(value: string): this {
            this.model.rut = value;
            return this;
        }

        setRutDv(value: string): this {
            this.model.rutDv = value;
            return this;
        }

        setTipoParticipante(value: string): this {
            this.model.tipoParticipante = value;
            return this;
        }

        setGiros(value: GiroComercial[]): this {
            this.model.giros = value.map(g => {
                const giro = new GiroComercialModel();
                giro.codigo = g.codigo;
                giro.fuente = g.fuente;
                giro.descripcion = g.descripcion;
                giro.categoriaTributaria = g.categoriaTributaria;
                giro.afectoIva = g.afectoIva === 'S';
                giro.fechaInicio = g.fechaInicio ? new Date(g.fechaInicio) : undefined;
                giro.esPrincipal = g.esPrincipal;
                return giro;
            });
            return this;
        }

        build(): OrganizacionModel {
            return this.model;
        }
    }
}

export class GiroComercialModel {
    codigo: string;
    fuente: string;
    descripcion: string;
    categoriaTributaria?: string;
    afectoIva?: boolean;
    fechaInicio?: Date;
    esPrincipal?: boolean;

    constructor() {
        this.codigo = "";
        this.descripcion = "";
        this.categoriaTributaria = undefined;
        this.afectoIva = undefined;
        this.fechaInicio = undefined;
        this.esPrincipal = undefined;
    }
}