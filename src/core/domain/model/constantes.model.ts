
export enum CATEGORY_PROCESS {
    DTE_FACTURA = "DTE-factura",
}

export enum facturaEstado {
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

export enum EVENT_CODES{
    FACTURA_PUBLICADA = "FACTURA_PUBLICADA",
    FACTURA_VACIA_PUBLICADA = "FACTURA_VACIA_PUBLICADA",
    FACTURA_DUPLICADA = "FACTURA_DUPLICADA",
    FACTURA_PROCESADA = "FACTURA_PROCESADA",
    FACTURA_ERROR_PROCESAMIENTO = "FACTURA_ERROR_PROCESAMIENTO",
}

export enum EVENT_DESCRIPTIONS  {
    FACTURA_PUBLICADA = "Factura publicada exitosamente",
    FACTURA_VACIA_PUBLICADA = "Factura vacía publicada exitosamente",
    FACTURA_DUPLICADA = "Factura duplicada, ya existe una factura con el mismo emisor y folio",
    FACTURA_PROCESADA = "Factura procesada exitosamente",
    FACTURA_ERROR_PROCESAMIENTO = "Error al procesar la factura",
}