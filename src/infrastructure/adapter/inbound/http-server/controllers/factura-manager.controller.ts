/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { Permissions } from '../decorators/permissions.decorator';
import { IFacturaManager } from 'src/core/domain/puertos/inbound/IFacturaPublisher.interface';
import { CoreExceptionFilter } from 'src/infrastructure/exceptionFileter/contacto.filter';
import { Request, Response } from 'express';
import { ApiResponse } from '../model/api-response.model';
import { UserProfileDTO } from '../model/dto/userProfile.response.dto';
import {
  CampoEditado,
  FacturaUpdateModel,
} from 'src/core/domain/model/facturaUpdate.model';
import { FacturaCreateRequestDto } from '../model/dto/facturaCreate.request.dto';

const permisosControlador = {
  VER_FACTURA: 'FCT_VEW',
  CREAR_FACTURA: 'FCT_CREATE',
  EDITAR_FACTURA: 'FCT_EDIT',
  ELIMINAR_FACTURA: 'FCT_DELETE',
  READ_ONLY: 'READ_ONLY',
};
@Controller('factura')
@UseFilters(CoreExceptionFilter)
export class FacturaManagerController {
  private readonly logger = new Logger(FacturaManagerController.name);

  constructor(
    @Inject('FACTURA_MANAGER_USE_CASE')
    private readonly facturaManager: IFacturaManager,
  ) {}

  @Post('url')
  @Permissions(permisosControlador.VER_FACTURA, permisosControlador.READ_ONLY)
  async getUrlFacturas(
    @Body()
    Body: {
      userUUID: string;
      organizacionUUID: string;
      facturas: string[];
    },
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const startedAt = Date.now();
    const correlationId = req['correlationId'];
    this.logger.log(`[START] getUrlFacturas `);

    const facturas = await this.facturaManager.ExecuteGetUrlFacturas(
      Body.facturas,
      correlationId,
    );
    const endDate = new Date();
    const duration = endDate.getTime() - startedAt;
    this.logger.log(`[END] getUrlFacturas - Duración: ${duration}ms`);
    return response
      .status(200)
      .json(new ApiResponse(HttpStatus.OK, 'Extracción exitosa', facturas));
  }

  /**
   * Obtiene las facturas asociadas a un usuario y organización específica.
   * @param uuid Identificador de usuario
   * @returns
   */
  @Get('list/:usuario/:orgUUID/:filtro')
  @Permissions(permisosControlador.VER_FACTURA, permisosControlador.READ_ONLY)
  async getFacturas(
    @Param('usuario') usuario: string,
    @Param('orgUUID') orgUUID: string,
    @Param('filtro') filtro: string,
    @Res() response: Response,
  ) {
    const initDAte = new Date();
    this.logger.log(`[START] getFacturas `);

    const facturas = await this.facturaManager.ExecuteGetFacturas(
      usuario,
      orgUUID,
      filtro,
    );
    const endDate = new Date();
    const duration = endDate.getTime() - initDAte.getTime();
    this.logger.log(`[END] getFacturas - Duración: ${duration}ms`);
    return response
      .status(200)
      .json(new ApiResponse(HttpStatus.OK, 'Extracción exitosa', facturas));
  }

  @Patch()
  @Permissions(permisosControlador.EDITAR_FACTURA)
  async updateFactura(@Req() request: Request, @Res() response: Response) {
    const startedAt = Date.now();
    this.logger.debug(
      `[START] updateFactura - Usuario: ${request.body.gestor}, Organización: ${request.body.ownerUUID}, FacturaID: ${request.body.id}`,
    );
    const facturaUpdate = new FacturaUpdateModel(
      request.body.id,
      request.body.ownerUUID,
      request.body.gestor,
      new CampoEditado(
        request.body.campoEditado.nombre,
        request.body.campoEditado.valor,
      ),
    ); // Asegúrate de que el cuerpo de la solicitud contenga los datos necesarios para actualizar la factura

    const { campo, valor, id, isUpdate, mensaje } =
      await this.facturaManager.ExecuteUpdateFactura(facturaUpdate);

    if (!isUpdate) {
      this.logger.warn(
        `No se pudo actualizar la factura, verifica que el ID sea correcto y que la factura esté en estado PENDIENTE_VALIDACION, facturaID: ${request.body.id}`,
      );
      return response
        .status(400)
        .json(
          new ApiResponse(HttpStatus.BAD_REQUEST, mensaje, {
            campo,
            id,
            valor,
            isUpdate,
          }),
        );
    }
    const endedAt = Date.now();
    this.logger.debug(
      `[END] updateFactura - Usuario: ${request.body.gestor}, Organización: ${request.body.ownerUUID}, FacturaID: ${request.body.id}, Duración: ${endedAt - startedAt}ms`,
    );
    return response
      .status(200)
      .json(
        new ApiResponse(HttpStatus.OK, mensaje, { campo, id, valor, isUpdate }),
      ); // Devuelve el campo actualizado y el nuevo valor
  }

  @Post()
  @Permissions(permisosControlador.CREAR_FACTURA)
  async publishFactura(@Req() request: Request, @Res() response: Response) {
    const startedAt = Date.now();
    this.logger.debug(
      `[START] publishFactura - Usuario: ${request.body.usuario}, Organización: ${request.body.organizacionId}`,
    );
    const isPublished = await this.facturaManager.ExecutePublicarFormFactura(
      FacturaCreateRequestDto.toModel(request.body as FacturaCreateRequestDto),
    );
    const endedAt = Date.now();
    this.logger.debug(
      `[END] publishFactura - Usuario: ${request.body.usuario}, Organización: ${request.body.organizacionId}, Duración: ${endedAt - startedAt}ms`,
    );
    if (!isPublished) {
      this.logger.error(
        `Error al publicar la factura para usuario ${request.body.usuario} y organización ${request.body.organizacionId}`,
      );
      return response
        .status(400)
        .json(
          new ApiResponse(
            HttpStatus.BAD_REQUEST,
            'Error al publicar la factura',
          ),
        );
    }
    return response
      .status(201)
      .json(
        new ApiResponse(
          HttpStatus.CREATED,
          'Factura publicada exitosamente',
          isPublished,
        ),
      );
  }

  @Get('terminos/activo')
  @Permissions(permisosControlador.VER_FACTURA, permisosControlador.READ_ONLY)
  async getVersionTerminosActiva(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<any> {
    const correlationId = req['correlationId'];
    this.logger.debug(
      `[START] getVersionTerminosActiva - CorrelationID: ${correlationId}`,
    );
    const terminos =
      await this.facturaManager.ExecuteGetVersionTerminosActiva();
    this.logger.debug(
      `[END] getVersionTerminosActiva - CorrelationID: ${correlationId}`,
    );
    return response
      .status(HttpStatus.OK)
      .json(new ApiResponse(HttpStatus.OK, 'Términos obtenidos', terminos));
  }

  @Post('autorizacion')
  @Permissions(permisosControlador.CREAR_FACTURA)
  async registrarAutorizacion(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<any> {
    const correlationId = req['correlationId'];
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { facturaId, versionTerminosId, acepto, usuarioUUID } = req.body;
    this.logger.debug(
      `[START] registrarAutorizacion - FacturaID: ${facturaId}, UsuarioUUID: ${usuarioUUID}, Acepto: ${acepto}, CorrelationID: ${correlationId}`,
    );
    await this.facturaManager.ExecuteRegistrarAutorizacion({
      facturaId,
      versionTerminosId,
      acepto,
      usuarioUUID,
      ipAddress,
      userAgent,
      correlationId,
    });
    this.logger.debug(`[END] registrarAutorizacion - FacturaID: ${facturaId}`);
    return response
      .status(HttpStatus.CREATED)
      .json(
        new ApiResponse(HttpStatus.CREATED, 'Autorización registrada', null),
      );
  }

  @Get('marketplace')
  @Permissions(permisosControlador.VER_FACTURA, permisosControlador.READ_ONLY)
  async getFacturasMarketplace(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<any> {
    const correlationId = req['correlationId'];
    this.logger.debug(
      `[START] getFacturasMarketplace - CorrelationID: ${correlationId}`,
    );
    const facturas = await this.facturaManager.ExecuteGetFacturasMarketPlace(
      'marketplace',
      'marketplace',
      'marketplace',
    );
    this.logger.debug(
      `[END] getFacturasMarketplace - CorrelationID: ${correlationId}`,
    );
    return response
      .status(HttpStatus.OK)
      .json(new ApiResponse(HttpStatus.OK, 'Facturas obtenidas', facturas));
  }
}
