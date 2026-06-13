import {
    Controller,
    Get,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Query,
    Res,
    UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import {
    CATALOGO_REPOSITORY,
    ICatalogoRepository,
} from 'src/core/domain/puertos/outbound/ICatalogo.repository';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { ApiResponse } from '../model/api-response.model';
import { Public } from '../decorators/public.decorator';

@Controller('catalogo')
@UseFilters(CoreExceptionFilter)
@Public()
export class CatalogoController {

    private readonly logger = new Logger(CatalogoController.name);

    constructor(
        @Inject(CATALOGO_REPOSITORY)
        private readonly catalogoRepository: ICatalogoRepository,
    ) { }

    /** GET /geo/regiones?pais=CL */
    @Get('geo/regiones')
    async getRegiones(
        @Query('pais') pais: string = 'CL',
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] geo/regiones pais=${pais}`);
        const data = await this.catalogoRepository.getRegiones(pais);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Regiones obtenidas', data),
        );
    }

    /** GET /geo/provincias?region_id=1 */
    @Get('geo/provincias')
    async getProvincias(
        @Query('region_id', ParseIntPipe) regionId: number,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] geo/provincias region_id=${regionId}`);
        const data = await this.catalogoRepository.getProvincias(regionId);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Provincias obtenidas', data),
        );
    }

    /** GET /geo/comunas?provincia_id=1 */
    @Get('geo/comunas')
    async getComunas(
        @Query('provincia_id', ParseIntPipe) provinciaId: number,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] geo/comunas provincia_id=${provinciaId}`);
        const data = await this.catalogoRepository.getComunas(provinciaId);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Comunas obtenidas', data),
        );
    }

    /** GET /catalogo/bancos?pais=CL */
    @Get('bancos')
    async getBancos(
        @Query('pais') pais: string = 'CL',
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] catalogo/bancos pais=${pais}`);
        const data = await this.catalogoRepository.getBancos(pais);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Bancos obtenidos', data),
        );
    }

    /** GET /catalogo/productos-financieros?tipo_org=FINANCIADORA */
    @Get('productos-financieros')
    async getProductosFinancieros(
        @Query('tipo_org') tipoOrg: string | undefined,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] catalogo/productos-financieros tipo_org=${tipoOrg ?? 'all'}`);
        const data = await this.catalogoRepository.getProductosFinancieros(tipoOrg);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Productos financieros obtenidos', data),
        );
    }

    @Get('media-category/:mediaType')
    async getMediaCategory(
        @Param('mediaType') mediaType: string,
        @Res() res: Response,
    ) {
        this.logger.log(`[GET] catalogo/media-category mediaType=${mediaType}`);
        const data = await this.catalogoRepository.getMediaCategory(mediaType);
        return res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, 'Media category obtenida', data),
        );
    }
}
