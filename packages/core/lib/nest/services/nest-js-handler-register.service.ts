import { Injectable, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

import { BaseHandlerRegister } from '../../core/services/base-handlers-register.service';

@Injectable()
export class NestJsHandlerRegister<T, TypeT extends Type<T> = Type<T>> extends BaseHandlerRegister<T, TypeT> {
  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  /**
   * Gets scoped handler instances with the provided context using NestJS ModuleRef
   * @param handlerTypes Set of handler types to resolve
   * @param context Optional context for scoped handlers
   * @returns A promise that resolves to an array of handler instances
   */
  protected override async getScopedHandlers(handlerTypes: Set<TypeT>, context?: object): Promise<T[]> {
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(context, contextId);

    return Promise.all(
      [...handlerTypes.values()].map((handlerType) =>
        this.moduleRef.resolve(handlerType, contextId, {
          strict: false,
        }),
      ),
    );
  }
}
