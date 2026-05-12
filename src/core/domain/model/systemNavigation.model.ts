class Sistema {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    modulos: Modulo[];
}

class Modulo {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    funcionalidades: Funcionalidad[];
    organizacionId: string[];
}

class Funcionalidad {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    permisos: Permiso[];
}

class Permiso {
    codigo: string;
    nombre: string;
}

export class SystemNavigationModel {
    sistemas: Sistema[] = [];

    static fromDatabaseRecord(record: any[]): SystemNavigationModel {

        const model = new SystemNavigationModel();

        const sistemaMap = new Map<string, Sistema>();
        const moduloMap = new Map<string, Modulo>();
        const funcionalidadMap = new Map<string, Funcionalidad>();
        const permisoMap = new Map<string, string>();

        record.forEach(row => {


            let sistema = sistemaMap.get(row.nombre_sistema);
            if (!sistema) {
                sistema = new Sistema();
                sistema.nombre = row.nombre_sistema;
                sistema.ruta = row.ruta_sistema;
                sistema.descripcion = row.descripcion_sistema;
                sistema.modulos = [];
                sistema.icono = row.sys_icon;
                sistemaMap.set(row.nombre_sistema, sistema);
            }

            let modulo = moduloMap.get(row.nombre_modulo);
            if (!modulo) {
                modulo = new Modulo();
                modulo.nombre = row.nombre_modulo;
                modulo.ruta = row.ruta_modulo;
                modulo.descripcion = row.descripcion_modulo;
                modulo.funcionalidades = [];
                modulo.icono = row.mod_icon;
                modulo.organizacionId = [row.organizacion_identity];
                moduloMap.set(row.nombre_modulo, modulo);
                sistema.modulos.push(modulo);
            } else {
                if (!modulo.organizacionId.includes(row.organizacion_identity)) {
                    modulo.organizacionId.push(row.organizacion_identity)
                }
            }

            let funcionalidad = funcionalidadMap.get(row.nombre_funcion);
            if (!funcionalidad) {
                funcionalidad = new Funcionalidad();
                funcionalidad.nombre = row.nombre_funcion;
                funcionalidad.ruta = row.ruta_funcion;
                funcionalidad.descripcion = row.descripcion_funcion;
                funcionalidad.icono = row.func_icon;
                funcionalidad.permisos = [];
                funcionalidadMap.set(row.nombre_funcion, funcionalidad);
                modulo.funcionalidades.push(funcionalidad);
            }

            let permiso = permisoMap.get(row.codigo_permiso);
            if (!permiso) {
                funcionalidad.permisos.push(row.codigo_permiso);
            }
            model.sistemas = Array.from(sistemaMap.values());
        });
        return model;
    }
}
