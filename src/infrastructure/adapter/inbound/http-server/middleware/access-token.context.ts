import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

type AccessTokenStore = {
  accessToken?: string;
  correlationId?: string;
};

@Injectable()
export class AccessTokenContext {
  private readonly storage = new AsyncLocalStorage<AccessTokenStore>();

  runWithContext<T>(context: AccessTokenStore, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  runWithAccessToken<T>(accessToken: string | undefined, callback: () => T): T {
    return this.storage.run({ accessToken }, callback);
  }

  getAccessToken(): string | undefined {
    return this.storage.getStore()?.accessToken;
  }

  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }
}