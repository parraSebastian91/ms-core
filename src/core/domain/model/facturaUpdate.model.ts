import { DomainException } from "src/core/share/errors/DomainException";

export enum CampoFactura {
    INVALIDO = "INVALIDO",
    NUMERO_FACTURA = "numeroFactura",
    RUT_DEUDOR = "rutDeudor",
    NOMBRE_RAZON_SOCIAL_DEUDOR = "nombreRazonSocialDeudor",
    MONTO_TOTAL = "montoTotal",
    FECHA_VENCIMIENTO = "fechaVencimiento",
    STATUS = "status",
    ASSET_ID = "asset_id"
}

export enum ColumnaFactura {
    ID = "id",
    NUMERO_FACTURA = "factura_numero",
    RUT_DEUDOR = "deudor_rut",
    NOMBRE_RAZON_SOCIAL_DEUDOR = "deudor_nombre",
    MONTO_TOTAL = "monto_total",
    FECHA_VENCIMIENTO = "fecha_vencimiento",
    STATUS = "status",
    ASSET_ID = "asset_id"
}

export class FacturaUpdateModel {
    id: string;
    ownerUUID: string;
    gestor: string;
    campoEditado: CampoEditado;

    constructor(id: string, ownerUUID: string, gestor: string, campoEditado: CampoEditado) {
        this.id = id;
        this.ownerUUID = ownerUUID;
        if (typeof gestor === 'string') {
            this.gestor = gestor.trim();
        }else {
            this.gestor = gestor["uuid"];
        }
        this.campoEditado = campoEditado;
    }

}

export class CampoEditado {

    validCampos = [
        CampoFactura.NUMERO_FACTURA,
        CampoFactura.RUT_DEUDOR,
        CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR,
        CampoFactura.MONTO_TOTAL,
        CampoFactura.FECHA_VENCIMIENTO,
        CampoFactura.STATUS,
        CampoFactura.ASSET_ID
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
            throw new DomainException(`El nombre del campo es inválido | ${nombre}`);
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
                this.valor = valor;
                break;
            case CampoFactura.NUMERO_FACTURA:
                if (isNaN(Number(valor))) {
                    throw new DomainException("El valor debe ser un número");
                }
                if (Number(valor) <= 0) {
                    throw new DomainException("El valor no puede ser negativo o cero");
                }
                this.valor = valor;
                break;
            case CampoFactura.FECHA_VENCIMIENTO:
                const fechaVencimiento = this.parseFecha(valor);
                if (!fechaVencimiento) {
                    throw new DomainException("El valor debe ser una fecha válida");
                }
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaVencimiento.setHours(0, 0, 0, 0);
                if (fechaVencimiento < hoy) {
                    throw new DomainException("La fecha de vencimiento no puede ser en el pasado");
                }
                this.valor = fechaVencimiento.toISOString();
                break;
            case CampoFactura.RUT_DEUDOR:
                const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
                if (!rutRegex.test(valor)) {
                    throw new DomainException("El valor debe ser un RUT válido (formato: XX.XXX.XXX-X)");
                }
                this.valor = valor;
                break;
            case CampoFactura.NOMBRE_RAZON_SOCIAL_DEUDOR:
                if (valor.length <= 3 || valor.length > 100) {
                    throw new DomainException("El valor debe tener entre 4 y 100 caracteres");
                }
                this.valor = valor;
                break;
            case CampoFactura.STATUS:
                const statusValidos = ["PROCESANDO","PENDIENTE_VALIDACION", "PENDIENTE_AUTORIZACION", "RECHAZADA", "APROBADA", "PUBLICADA"];
                if (!statusValidos.includes(valor)) {
                    throw new DomainException(`El valor debe ser uno de los siguientes: ${statusValidos.join(", ")}`);
                }
                this.valor = valor;
                break;
            case CampoFactura.ASSET_ID:
                if (valor.length === 0) {
                    throw new DomainException("El valor no puede estar vacío para el campo ASSET_ID");
                }
                this.valor = valor;
                break;
        }

    }

    private parseFecha(valor: string): Date | null {
        const valorLimpio = valor.trim();
        const formatoLatino = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = valorLimpio.match(formatoLatino);

        if (match) {
            const [, dia, mes, anio] = match;
            const d = Number(dia);
            const m = Number(mes);
            const y = Number(anio);
            const fecha = new Date(y, m - 1, d);

            const esFechaValida =
                fecha.getFullYear() === y &&
                fecha.getMonth() === m - 1 &&
                fecha.getDate() === d;

            return esFechaValida ? fecha : null;
        }

        const fecha = new Date(valorLimpio);
        return isNaN(fecha.getTime()) ? null : fecha;
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
            case CampoFactura.STATUS:
                return ColumnaFactura.STATUS;
            case CampoFactura.ASSET_ID:
                return ColumnaFactura.ASSET_ID;
            default:
                return ColumnaFactura.ID;
        }
    }
}