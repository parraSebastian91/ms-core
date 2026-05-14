import { DomainException } from "src/core/share/errors/DomainException";

export enum CampoFactura {
    INVALIDO = "INVALIDO",
    NUMERO_FACTURA = "numeroFactura",
    RUT_DEUDOR = "rutDeudor",
    NOMBRE_RAZON_SOCIAL_DEUDOR = "nombreRazonSocialDeudor",
    MONTO_TOTAL = "montoTotal",
    FECHA_VENCIMIENTO = "fechaVencimiento"
}

export enum ColumnaFactura {
    ID = "id",
    NUMERO_FACTURA = "factura_numero",
    RUT_DEUDOR = "deudor_rut",
    NOMBRE_RAZON_SOCIAL_DEUDOR = "deudor_nombre",
    MONTO_TOTAL = "monto_total",
    FECHA_VENCIMIENTO = "fecha_vencimiento"
}

export class FacturaUpdateModel {
    id: string;
    ownerUUID: string;
    gestor: string;
    campoEditado: CampoEditado;

    constructor(id: string, ownerUUID: string, gestor: string, campoEditado: CampoEditado) {
        this.id = id;
        this.ownerUUID = ownerUUID;
        this.gestor = gestor;
        this.campoEditado = campoEditado;
    }

}

export class CampoEditado {

    validCampos = [
        CampoFactura.NUMERO_FACTURA,
        CampoFactura.RUT_DEUDOR,
        CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR,
        CampoFactura.MONTO_TOTAL,
        CampoFactura.FECHA_VENCIMIENTO
    ];

    nombre: string = '';
    valor: string;
    nombreColumna: string;

    constructor(nombre: CampoFactura, valor: string) {
        this.setNombre(nombre);
        this.setValor(valor);
    }

    setNombre(nombre: CampoFactura) {
        if (this.validCampos.includes(nombre)) {
            this.nombreColumna = this.mapearNombreColumna(nombre);
            this.nombre = nombre;
        } else {
            throw new DomainException("El nombre del campo es inválido");
        }
    }

    setValor(valor: string) {

        if (valor.trim() === '' || valor == null || valor == undefined || valor.length === 0) {
            throw new DomainException("El valor no puede estar vacío");
        }

        switch (this.nombre) {
            case CampoFactura.MONTO_TOTAL:
                if (isNaN(Number(valor))) {
                    throw new DomainException("El valor debe ser un número");
                }
                if (Number(valor) <= 0) {
                    throw new DomainException("El valor no puede ser negativo o cero");
                }
                break;
            case CampoFactura.NUMERO_FACTURA:
                if (isNaN(Number(valor))) {
                    throw new DomainException("El valor debe ser un número");
                }
                if (Number(valor) <= 0) {
                    throw new DomainException("El valor no puede ser negativo o cero");
                }
                break;
            case CampoFactura.FECHA_VENCIMIENTO:
                if (isNaN(Date.parse(valor))) {
                    throw new DomainException("El valor debe ser una fecha válida");
                }
                if (new Date(valor) < new Date()) {
                    throw new DomainException("La fecha de vencimiento no puede ser en el pasado");
                }
                break;
            case CampoFactura.RUT_DEUDOR:
                const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
                if (!rutRegex.test(valor)) {
                    throw new DomainException("El valor debe ser un RUT válido (formato: XX.XXX.XXX-X)");
                }
                break;
            case CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR:
                if (valor.length <= 3 || valor.length > 100) {
                    throw new DomainException("El valor debe tener entre 4 y 100 caracteres");
                }
                break;
        }
        this.valor = valor;
    }

    private mapearNombreColumna(nombre: string): string {
        switch (nombre) {
            case CampoFactura.NUMERO_FACTURA:
                return ColumnaFactura.NUMERO_FACTURA;
            case CampoFactura.RUT_DEUDOR:
                return ColumnaFactura.RUT_DEUDOR;
            case CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR:
                return ColumnaFactura.NOMBRE_RAZON_SOCIAL_DEUDOR;
            case CampoFactura.MONTO_TOTAL:
                return ColumnaFactura.MONTO_TOTAL;
            case CampoFactura.FECHA_VENCIMIENTO:
                return ColumnaFactura.FECHA_VENCIMIENTO;
            default:
                return ColumnaFactura.ID;
        }
    }
}