import { Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import type { IEvent, IEventHandler, IHandlerRegister } from '../../core/interfaces';
import { EventOption } from '../../core/interfaces/event-handler.interface';
import { IEventHandlerSignature } from '../../core/interfaces/handler-signature.interface';
import { EventDrivenCore } from '../constants';
import { EVENTS_HANDLER_METADATA } from '../decorators/constants';

@Injectable()
export class HandlerRegistrar<TEvent extends IEvent = IEvent> {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(EventDrivenCore.HANDLER_REGISTER)
    private readonly handlerRegister: IHandlerRegister<IEventHandler<TEvent>>,
  ) {}

  /**
   * Register event handlers in the HandlerRegister
   * @param handlers Array of event handler types to register
   */
  register(handlers: Type<IEventHandler<TEvent>>[] = []): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  /**
   * Register a single event handler in the HandlerRegister
   * @param handler Event handler type to register
   * @returns boolean indicating if registration was successful
   */
  registerHandler(handler: Type<IEventHandler<TEvent>>): boolean {
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
            this.handlerRegister.addHandler(handlerKey, instance);
          }
        } else {
          this.registerHandlerSignature(eventOptions);
          const handlerKey = this.buildHandlerKey(eventOptions);
          this.handlerRegister.addHandler(handlerKey, instance);
        }
      }
    } catch {
      try {
        this.moduleRef.introspect(handler);
        if (Array.isArray(eventOptions)) {
          for (const singleTarget of eventOptions) {
            this.registerHandlerSignature(singleTarget);
            const handlerKey = this.buildHandlerKey(singleTarget);
            this.handlerRegister.addScopedHandler(handlerKey, handler);
          }
        } else {
          this.registerHandlerSignature(eventOptions);
          const handlerKey = this.buildHandlerKey(eventOptions);
          this.handlerRegister.addScopedHandler(handlerKey, handler);
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
    const signature: IEventHandlerSignature =
      typeof eventOptions === 'function' ? { event: eventOptions } : eventOptions;

    this.handlerRegister.addHandlerSignature(signature);
  }

  private reflectEventOptions(handler: Type<IEventHandler<TEvent>>): EventOption {
    return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
  }
}
