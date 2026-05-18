/*
https://docs.nestjs.com/interceptors#interceptors
*/

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AccessTokenContext } from './access-token.context';

@Injectable()
export class AccessTokenInterceptor implements NestInterceptor {
  constructor(private readonly accessTokenContext: AccessTokenContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const accessToken = this.extractAccessToken(request);
    const correlationId = this.extractCorrelationId(request) ?? randomUUID();

    response.setHeader('X-Correlation-Id', correlationId);

    return this.accessTokenContext
      .runWithContext({ accessToken, correlationId }, () => next.handle())
      .pipe(
        tap(() => void 0),
      );
  }

  private extractAccessToken(request: Request): string | undefined {
    const userToken = (request as any)?.user?.accessToken;
    if (typeof userToken === 'string' && userToken.trim().length > 0) {
      return userToken;
    }

    const authorization = request.headers?.authorization;
    const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }

    return undefined;
  }

  private extractCorrelationId(request: Request): string | undefined {
    const correlationIdHeader = request.headers?.['x-correlation-id'];
    const correlationId = Array.isArray(correlationIdHeader)
      ? correlationIdHeader[0]
      : correlationIdHeader;

    if (typeof correlationId === 'string' && correlationId.trim().length > 0) {
      return correlationId.trim();
    }

    return undefined;
  }
}
