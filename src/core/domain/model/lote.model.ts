/**
 * Una tanda de documentos subidos juntos.
 *
 * Agrupa ARCHIVOS, no facturas: cuando la persona confirma la tanda las
 * facturas todavía no existen —nacen cuando el worker leyó cada documento— así
 * que el vínculo nace en el asset y la factura lo hereda.
 */
export class LoteModel {
  id: string;
  /**
   * Lo propone el sistema y se puede renombrar después.
   *
   * Pedirlo al subir agrega fricción justo cuando la persona quiere terminar, y
   * a las dos semanas nadie recuerda qué era "Tanda 3". Que se pueda renombrar
   * más tarde es lo que lo vuelve útil.
   */
  nombre: string;
  descripcion?: string;
  organizacionId: string;
  gestorUuid: string;

  constructor(organizacionId: string, gestorUuid: string, nombre: string, descripcion?: string) {
    this.id = '';
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.organizacionId = organizacionId;
    this.gestorUuid = gestorUuid;
  }

  /**
   * El nombre que se propone cuando la persona no escribe uno.
   *
   * Lleva la fecha y el tamaño de la tanda porque son los dos datos con los que
   * alguien la reconoce después: "la de ayer, la de doce".
   */
  static nombrePropuesto(cantidad: number, cuando: Date = new Date()): string {
    const f = cuando.toLocaleDateString('es-CL', { day: 'numeric', month: 'numeric', year: 'numeric' });
    return `Tanda ${f} · ${cantidad} ${cantidad === 1 ? 'factura' : 'facturas'}`;
  }
}
