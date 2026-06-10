import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { GiroComercialModel, OrganizacionModel } from "src/core/domain/model/organizacion.model";

export class GuardarVerificacionDto {
    organizacionId: number;
    rawResponse: Record<string, any>;
    fuente: string;
}

export type TipoPersona = 'JURIDICA' | 'PERSONA_NATURAL';
export type TipoParticipante = 'CEDENTE' | 'FINANCIERA' | 'BROKER';


export class GiroComercial {
    @IsNotEmpty()
    @IsString()
    codigo: string;

    @IsNotEmpty()
    @IsString()
    fuente: string;

    @IsNotEmpty()
    @IsString()
    descripcion: string;

    @IsOptional()
    @IsString()
    categoriaTributaria?: string;

    @IsOptional()
    @IsString()
    afectoIva?: string;

    @IsOptional()
    @IsString()
    fechaInicio?: string;

    @IsOptional()
    @IsBoolean()
    esPrincipal?: boolean;


}

export class CrearOrganizacionDto {
    @IsNotEmpty()
    @IsIn(['JURIDICA', 'PERSONA_NATURAL'])
    tipoPersona: TipoPersona;

    @IsNotEmpty()
    @IsIn(['CEDENTE', 'FINANCIADORA', 'BROKER'])
    tipoParticipacion: TipoParticipante;

    @IsNotEmpty()
    @IsString()
    rut: string;

    @IsNotEmpty()
    @IsString()
    razonSocial: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GiroComercial)
    giros?: GiroComercial[];

    static toModel(org: CrearOrganizacionDto): OrganizacionModel {
        return OrganizacionModel.build()            
            .setRazonSocial(org.razonSocial)
            .setFormatoRut(org.rut)
            .setTipoOrganizacion(org.tipoPersona)
            .setTipoParticipante(org.tipoParticipacion)
            .build();;
    }
}