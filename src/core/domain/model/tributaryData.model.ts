import { GiroComercialModel } from "./organizacion.model";

export class TributaryModel {
    paisCodigo: string;
    identificadorFiscal: string
    razonSocialOficial: string;
    registrado: boolean;
    activo: boolean;
    cumpleObligacion: boolean;
    primeraCategoria: boolean;
    emisorDte: boolean;
    tieneFacturaElectronica: boolean;
    fechaInicioActividades: Date | null;
    tieneDeudaPrevisional: boolean;
    tieneQuiebra: boolean;
    tieneRestriccionFolios: boolean;
    tieneAlertaGrave: boolean;
    ultimaAlertaTexto: string | null;
    actividades: GiroComercialModel[];
    rawResponse?: any; // Para guardar la respuesta cruda si es necesario para futuras referencias o debugging
    constructor() { }

    static fromRaw(raw: any, type: string): TributaryModel {
        const model = new TributaryModel();
        const parseFechaChile = (fecha: string | null | undefined): Date | null => {
            if (!fecha) return null;
            const [d, m, y] = fecha.split('-');
            if (!d || !m || !y) return null;
            return new Date(`${y}-${m}-${d}`);
        }
        switch (type) {
            case 'SII':
                const alertasGraves = (raw.alertaTablas ?? []).flatMap((t: any) =>
                    (t.alertas ?? []).filter((a: any) => a.grave === 'S'),
                );
                const ultimaAlerta = alertasGraves[0]?.texto
                    ?? (raw.alertaTablas?.[0]?.alertas?.[0]?.texto ?? null);

                const tieneFacturaElectronica = (raw.timbrajes ?? [])
                    .some((t: any) => t.codigo === '0033');

                const actividades = (raw.girosNegocio ?? []).map((g: any, idx: number) => ({
                    codigo: g.codigo,
                    descripcion: g.descripcion,
                    categoriaTributaria: parseInt(g.categoriaTributaria, 10) || null,
                    afectoIva: g.indicadorAfectoIva === 'S',
                    fechaInicio: parseFechaChile(g.fechaInicio),
                    esPrincipal: idx === 0,
                }));

                model.paisCodigo = 'CL';
                model.identificadorFiscal = '';          // RUT vendrá del raw cuando sea necesario
                model.razonSocialOficial = raw.nombre ?? null;
                model.registrado = raw.registrado ?? false;
                model.activo = raw.inicioActividades ?? false;
                model.cumpleObligacion = raw.cumpleObligacionTributaria === 'SI';
                model.primeraCategoria = raw.tienePrimeraCategoria ?? false;
                model.emisorDte = raw.tieneEMTP ?? false;
                model.tieneFacturaElectronica = raw.tieneFacturaElectronica ?? false;
                model.fechaInicioActividades = parseFechaChile(raw.fechaInicioActividades);
                model.tieneDeudaPrevisional = raw.tiene8102 ?? false;
                model.tieneQuiebra = raw.conTegi ?? false;
                model.tieneRestriccionFolios = raw.tieneROFL ?? false;
                model.tieneAlertaGrave = alertasGraves.length > 0;
                model.ultimaAlertaTexto = ultimaAlerta;
                model.actividades = actividades;
                model.rawResponse = raw;
                break;
            default:
                // Mapear campos genéricos o lanzar error si el tipo no es reconocido
                break;
        }
        return model;
    }
}
