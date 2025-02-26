import { Injectable, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

import { EventOption } from '../interfaces/event-handler.interface';
import { IHandlerRegister } from '../interfaces/handler-register.interface';
import { IEventHandlerSignature } from '../interfaces/handler-signature.interface';

@Injectable()
export class HandlerRegister<T, TypeT extends Type<T> = Type<T>> implements IHandlerRegister<T, TypeT> {
  private handlers = new Map<string, Set<T>>();
  private scopedHandlers = new Map<string, Set<TypeT>>();
  private handlersSignatures: IEventHandlerSignature[] = [];

  constructor(private moduleRef: ModuleRef) {}

  // Add handler to the handlers map
  addHandler(handlerKey: string, instance: T): void {
    const set = this.handlers.get(handlerKey) ?? new Set();
    this.handlers.set(handlerKey, set.add(instance));
  }

  // Add scoped handler to the scopedHandlers map
  addScopedHandler(handlerKey: string, handler: TypeT): void {
    const set = this.scopedHandlers.get(handlerKey) ?? new Set();
    this.scopedHandlers.set(handlerKey, set.add(handler));
  }

  // Add handler signature to the handlersSignatures array
  addHandlerSignature(signature: IEventHandlerSignature): void {
    this.handlersSignatures.push(signature);
  }

  async get<E>(event: E, context?: object): Promise<T[] | undefined> {
    const eventName = this.getName(event);
    const handlerKey = this.buildHandlerKey(eventName);
    const singletonHandlers = [...(this.handlers.get(handlerKey) ?? [])];

    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(context, contextId);
    const handlerTypes = this.scopedHandlers.get(handlerKey);

    if (!handlerTypes) return singletonHandlers;
    const scopedHandlers = await Promise.all(
      [...handlerTypes.values()].map((handlerType) =>
        this.moduleRef.resolve(handlerType, contextId, {
          strict: false,
        }),
      ),
    );

    return [...singletonHandlers, ...scopedHandlers];
  }

  getName<E>(event: E): string {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name as string;
  }

  getHandlerSignatures(): Readonly<IEventHandlerSignature[]> {
    return this.handlersSignatures;
  }

  private buildHandlerKey(eventName: string): string;
  private buildHandlerKey(eventOptions: EventOption): string;
  private buildHandlerKey(event: EventOption | string): string {
    if (typeof event === 'string') {
      return event;
    }
    if (typeof event === 'function') {
      return event.name;
    }
    return event.event.name;
  }
}
