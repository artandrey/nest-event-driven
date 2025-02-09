import { Injectable, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

import { EVENTS_HANDLER_METADATA } from '../decorators/constants';
import { EventOption } from '../interfaces/event-handler.interface';
import { IEventHandlerSignature } from '../interfaces/handler-signature.interface';

@Injectable()
export class HandlerRegister<T, TypeT extends Type<T> = Type<T>> {
  private handlers = new Map<string, Set<T>>();
  private scopedHandlers = new Map<string, Set<TypeT>>();
  private handlersSignatures: IEventHandlerSignature[] = [];

  constructor(private moduleRef: ModuleRef) {}

  registerHandler(handler: TypeT): boolean {
    const eventOptions = this.reflectEventOptions(handler);
    if (!eventOptions) {
      return false;
    }

    try {
      const instance = this.moduleRef.get(handler, { strict: false });

      if (instance) {
        if (Array.isArray(eventOptions)) {
          for (const singleTarget of eventOptions) {
            this.registerHandlerSignature(singleTarget);
            const handlerKey = this.buildHandlerKey(singleTarget);
            const set = this.handlers.get(handlerKey) ?? new Set();
            this.handlers.set(handlerKey, set.add(instance));
          }
        } else {
          this.registerHandlerSignature(eventOptions);
          const handlerKey = this.buildHandlerKey(eventOptions);
          const set = this.handlers.get(handlerKey) ?? new Set();
          this.handlers.set(handlerKey, set.add(instance));
        }
      }
    } catch {
      try {
        this.moduleRef.introspect(handler);
        if (Array.isArray(eventOptions)) {
          for (const singleTarget of eventOptions) {
            this.registerHandlerSignature(singleTarget);
            const handlerKey = this.buildHandlerKey(singleTarget);
            const set = this.scopedHandlers.get(handlerKey) ?? new Set();
            this.scopedHandlers.set(handlerKey, set.add(handler));
          }
        } else {
          this.registerHandlerSignature(eventOptions);
          const handlerKey = this.buildHandlerKey(eventOptions);
          const set = this.scopedHandlers.get(handlerKey) ?? new Set();
          this.scopedHandlers.set(handlerKey, set.add(handler));
        }
      } catch {
        return false;
      }
    }

    return true;
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

  private registerHandlerSignature(eventOptions: EventOption) {
    if (typeof eventOptions === 'function') {
      this.handlersSignatures.push({ event: eventOptions });
    } else {
      this.handlersSignatures.push(eventOptions);
    }
  }

  private reflectEventOptions(handler: TypeT): EventOption {
    return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
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
}
