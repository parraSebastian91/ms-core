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

class Organizacion {
    nombre: string;
    uuid: string;
    sistemas: Sistema[];
}

class Contacto {
    nombres: string;
    usuario: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    avatar: string;
}

export class SystemNavigationModel {
    organizacion: Organizacion[];
    contacto: Contacto;

    static fromDatabaseRecord(record: any[]): SystemNavigationModel {

        const model = new SystemNavigationModel();

        const contacto = new Contacto();
        contacto.usuario = record[0].username;
        contacto.nombres = record[0].nombres;
        contacto.apellidoPaterno = record[0].apellido_paterno;
        contacto.apellidoMaterno = record[0].apellido_materno;
        contacto.correo = record[0].correo;
        contacto.avatar = record[0].avatar;
        model.contacto = contacto;


        const organizacionMap = new Map<string, Organizacion>();
        const sistemaMap = new Map<string, Sistema>();
        const moduloMap = new Map<string, Modulo>();
        const funcionalidadMap = new Map<string, Funcionalidad>();
        const permisoMap = new Map<string, string>();

        record.forEach(row => {
            let organizacion = organizacionMap.get(row.uuid_organizacion);

            if (!organizacion) {
                organizacion = new Organizacion();
                organizacion.nombre = row.nombre_organizacion;
                organizacion.uuid = row.uuid_organizacion;
                organizacionMap.set(row.uuid_organizacion, organizacion);
            }

            let sistema = sistemaMap.get(row.nombre_sistema);
            if (!sistema) {
                sistema = new Sistema();
                sistema.nombre = row.nombre_sistema;
                sistema.ruta = row.ruta_sistema;
                sistema.descripcion = row.descripcion_sistema;
                sistema.modulos = [];
                sistema.icono = row.sys_icon;
                console.log(`Sistema encontrado: ${sistema.icono}`);
                sistemaMap.set(row.nombre_sistema, sistema);
                organizacion.sistemas = organizacion.sistemas || [];
                organizacion.sistemas.push(sistema);
            }

            let modulo = moduloMap.get(row.nombre_modulo);
            if (!modulo) {
                modulo = new Modulo();
                modulo.nombre = row.nombre_modulo;
                modulo.ruta = row.ruta_modulo;
                modulo.descripcion = row.descripcion_modulo;
                modulo.funcionalidades = [];
                modulo.icono = row.mod_icon;
                moduloMap.set(row.nombre_modulo, modulo);
                sistema.modulos.push(modulo);
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

        });

        model.organizacion = Array.from(organizacionMap.values());


        return model;

    }
}
