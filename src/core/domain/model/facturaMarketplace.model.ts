export class FacturaMarketplace {
  facturaId: string;
  folio: string;
  razonSocial: string;
  rutDeudor: string;
  monto: number;
  fechaVencimiento: string;
  diasRestantes: number;
  cantidadOfertas: number;
  tasaMinima: number | null;
  esPreferido: boolean;
  tieneOfertaPropia: boolean;
  publicadoEn: string;
  nueva?: boolean;
}