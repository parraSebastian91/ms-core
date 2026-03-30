import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { UserProfileModel } from "src/core/domain/model/userProfile.model";
import { IUserProfileRepository } from "src/core/domain/puertos/outbound/IUserProfile.Repository";
import { DataSource } from "typeorm";

@Injectable()
export class UserProfileRepositoryAdapter implements IUserProfileRepository {

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) { }


    async getUserProfile(uuid: string): Promise<UserProfileModel | null> {
        const configuredSchema = (this.dataSource.options as { schema?: string }).schema || "public";
        const schema = configuredSchema.replace(/"/g, '""');

        const query = `select 
                        u.username,
                        u.created_at as "ingreso",
                        u.activo,
                        c.nombres,
                        c.apellido_paterno,
                        c.apellido_materno,
                        c.direccion,
                        c.celular,
                        c.correo,
                        c.fecha_nacimiento,
                        c.redes_sociales,
                        c.tipo_documento,
                        c.numero_documento,
                        c.logo_metadata as "avatar", 
                        tc.nombre as "tipo_contacto"
                        from 
                            "${schema}".usuario u left join "${schema}".contacto c 
                                on u.contacto_id = c.contacto_id 
                            left join "${schema}".tipo_contacto tc 
                                on c.tipo_contacto_id = tc.tipo_contacto_id 
                        where u.usuario_uuid = $1`;

        const result = await this.dataSource.query(query, [uuid]);
        
        if (!result?.length) return null;

        return Object.assign(new UserProfileModel(), result[0]);
    }
}