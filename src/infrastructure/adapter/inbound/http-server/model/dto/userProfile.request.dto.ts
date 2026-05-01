import { UserProfileModel } from "src/core/domain/model/userProfile.model";

class Nombre {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;

    constructor(datoContacto: UserProfileModel) {
        this.nombres = datoContacto.nombres;
        this.apellidoPaterno = datoContacto.apellido_paterno;
        this.apellidoMaterno = datoContacto.apellido_materno;
    }

    getNombreCompleto(): string {
        return `${this.nombres} ${this.apellidoPaterno} ${this.apellidoMaterno}`;
    }

}

class DatosContacto {
    tipoContacto: string;
    correo: string;
    telefono: string;
    ubicacion: string;
    documento: TipoDocumento;
    constructor(datoContacto: UserProfileModel) {
        this.tipoContacto = datoContacto.tipo_contacto;
        this.correo = datoContacto.correo;
        this.telefono = datoContacto.celular;
        this.ubicacion = datoContacto.direccion;
        this.documento = new TipoDocumento(datoContacto);
    }
}

class TipoDocumento {
    tipo: string;
    numero: string;

    constructor(datoContacto: UserProfileModel) {
        this.tipo = datoContacto.tipo_documento;
        this.numero = datoContacto.numero_documento;
    }
}

class RedesSociales {
    tipo: string;
    enlace: string;
    constructor(tipo: string, enlace: string) {
        this.tipo = tipo;
        this.enlace = enlace;
    }

    static fromJsonBject(datoContacto: UserProfileModel): RedesSociales[] {
        console.log("Redes sociales JSON:", datoContacto.redes_sociales);
        //const json = JSON.parse(datoContacto.redes_sociales);
        return Object.keys(datoContacto.redes_sociales).map(key => {
            return new RedesSociales(key, datoContacto.redes_sociales[key]);
        })
    }

}

export class UserProfileReqResDTO {
    username: string;
    nombreCompleto: string;
    nombre: Nombre;
    datosContacto: DatosContacto;
    rrss: RedesSociales[];
    telefono: string;
    ubicacion: string;

    constructor() {
        this.username = "";
        this.nombreCompleto = "";
        this.nombre = new Nombre(new UserProfileModel());
        this.datosContacto = new DatosContacto(new UserProfileModel());
        this.rrss = [];
        this.telefono = "";
        this.ubicacion = "";
    }


    static builder(model: UserProfileModel): UserProfileReqResDTO {

        const dto = new UserProfileReqResDTO();

        dto.username = model.username;
        dto.nombre = new Nombre(model);
        dto.nombreCompleto = dto.nombre.getNombreCompleto();
        dto.datosContacto = new DatosContacto(model);
        dto.rrss = RedesSociales.fromJsonBject(model);
        dto.telefono = model.celular;
        dto.ubicacion = model.direccion
        return dto;
    }

    static toModel(dto: UserProfileReqResDTO): UserProfileModel {
        const model = new UserProfileModel();
        model.username = dto.username;
        model.nombres = dto.nombre.nombres;
        model.apellido_paterno = dto.nombre.apellidoPaterno;
        model.apellido_materno = dto.nombre.apellidoMaterno;
        model.tipo_contacto = dto.datosContacto.tipoContacto;
        model.correo = dto.datosContacto.correo;
        model.celular = dto.datosContacto.telefono;
        model.direccion = dto.datosContacto.ubicacion;
        model.tipo_documento = dto.datosContacto.documento.tipo;
        model.numero_documento = dto.datosContacto.documento.numero;
        // model.redes_sociales = dto.rrss.reduce((acc, rrss) => {
        //     acc[rrss.tipo] = rrss.enlace;
        //     return acc;
        // }, {});
        return model;
    }

}