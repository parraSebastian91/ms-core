
export enum CATEGORY_PROCESS {
    DTE_FACTURA = "DTE-factura",
    DTE_FACTURA_RESPALDO = "DTE-factura-respaldo",
}

export enum EVENT_CODES {
    READY = "READY",
    ERROR = "ERROR"
}


export enum createdBy{
    FORM = "FORM",
    OCR = "OCR",
    AGENT = "AGENT"
}


export enum TIPO_PERMISO {
    VISTA = "VIEW",
}

export enum RESOURCE_TYPE {
    FACTURA = "FACTURA",
}


export enum facturaEstado {
    PROCESANDO = "PROCESANDO",
    PENDIENTE_AUTORIZACION = "PENDIENTE_AUTORIZACION",
    PENDIENTE_VALIDACION = "PENDIENTE_VALIDACION",
    PUBLICADA = "PUBLICADA",
    OFERTADA = "OFERTADA",
    FINANCIADA = "FINANCIADA",
    PAGADA = "PAGADA",
    RECHAZADA = "RECHAZADA",
    CANCELADA = "CANCELADA",
    VENCIDA = "VENCIDA",
    DENUNCIADA = "DENUNCIADA",
}

export enum EVENT_CODES {
    FACTURA_PENDIENTE_AUTORIZACION = "PENDIENTE_AUTORIZACION",
    FACTURA_PUBLICADA = "FACTURA_PUBLICADA",
    FACTURA_PUBLICADA_PENDIENTE_VALIDACION = "FACTURA_PUBLICADA_PENDIENTE_VALIDACION",
    FACTURA_VACIA_PUBLICADA = "FACTURA_VACIA_PUBLICADA",
    FACTURA_DUPLICADA = "FACTURA_DUPLICADA",
    FACTURA_PROCESADA = "FACTURA_PROCESADA",
    FACTURA_RECHAZADA = "FACTURA_RECHAZADA",
    FACTURA_RESPALDO_ACTUALIZADO = "FACTURA_RESPALDO_ACTUALIZADO",
    FACTURA_ERROR_PROCESAMIENTO = "FACTURA_ERROR_PROCESAMIENTO",
    FACTURA_ERROR_VALIDACION = "FACTURA_ERROR_VALIDACION",
    FACTURA_CON_DISCREPANCIAS_OCR = "FACTURA_CON_DISCREPANCIAS_OCR",
    FACTURA_RESPALDO_SIN_DISCREPANCIAS = "FACTURA_RESPALDO_SIN_DISCREPANCIAS",
}

export enum EVENT_DESCRIPTIONS {
    FACTURA_PENDIENTE_AUTORIZACION = "Factura pendiente de autorización, debe autorizar para poder publicar la factura",
    FACTURA_PUBLICADA = "Factura publicada exitosamente",
    FACTURA_VACIA_PUBLICADA = "Factura vacía publicada exitosamente",
    FACTURA_DUPLICADA = "Factura duplicada, ya existe una factura con el mismo emisor y folio",
    FACTURA_PROCESADA = "Factura procesada exitosamente",
    FACTURA_RECHAZADA = "Factura rechazada",
    FACTURA_RESPALDO_ACTUALIZADO = "Factura de respaldo actualizada exitosamente",
    FACTURA_ERROR_PROCESAMIENTO = "Error al procesar la factura",
    FACTURA_ERROR_VALIDACION = "Error de validación de la factura, Usuario u organización no válidos",
    FACTURA_PUBLICADA_PENDIENTE_VALIDACION = "Factura publicada exitosamente, pendiente de validación",
    FACTURA_CON_DISCREPANCIAS_OCR = "El documento de respaldo presenta diferencias con los datos declarados. Por favor revise las notas.",
    FACTURA_RESPALDO_SIN_DISCREPANCIAS = "El documento de respaldo fue verificado por OCR y coincide con los datos declarados.",
}

export enum ROLE_PERMISSION_CODES {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    SUPERVISOR = "SUPERVISOR",
    USR_STD = "USR_STD",
    READ_ONLY = "READ_ONLY",
    CLIENTE_CEDENTE = "CLIENTE_CEDENTE",
    EJECUTIVO_FINANCIADORA = "EJECUTIVO_FINANCIADORA",
    ADMIN_FINANCIADORA = "ADMIN_FINANCIADORA",
    ADMIN_CEDENTE = "ADMIN_CEDENTE",
}

export enum TIPO_PARTICIPANTE {
    CEDENTE = "CEDENTE",
    FINANCIADORA = "FINANCIADORA",
}