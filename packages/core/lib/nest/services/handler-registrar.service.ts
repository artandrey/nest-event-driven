import { Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import type { Event, EventHandler, EventHandlerSignature, HandlerRegister } from '../../core/';
import { EventDrivenCore } from '../constants';
import { EVENTS_HANDLER_METADATA } from '../decorators/constants';
import { EventOption } from '../interfaces';

@Injectable()
export class HandlerRegistrar<TEvent extends Event = Event> {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(EventDrivenCore.HANDLER_REGISTER)
    private readonly handlerRegister: HandlerRegister<EventHandler<TEvent>>,
  ) {}

  /**
   * Register event handlers in the HandlerRegister
   * @param handlers Array of event handler types to register
   */
  register(handlers: Type<EventHandler<TEvent>>[] = []): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  /**
   * Register a single event handler in the HandlerRegister
   * @param handler Event handler type to register
   * @returns boolean indicating if registration was successful
   */
  registerHandler(handler: Type<EventHandler<TEvent>>): boolean {
    const eventOptions = this.reflectEventOptions(handler);
    if (!eventOptions) {
      return false;
    }

    try {
      const instance = this.moduleRef.get(handler, { strict: false });

      if (instance) {
        if (Array.isArray(eventOptions)) {
          for (const singleTarget of eventOptions) {
            this.handlerRegister.addHandler(this.handlerOptionsToHandlerSignature(singleTarget), instance);
          }
        } else {
          this.handlerRegister.addHandler(this.handlerOptionsToHandlerSignature(eventOptions), instance);
        }
      }
    } catch {
      try {
        this.moduleRef.introspect(handler);
        if (Array.isArray(eventOptions)) {
          for (const singleTarget of eventOptions) {
            this.handlerRegister.addScopedHandler(this.handlerOptionsToHandlerSignature(singleTarget), handler);
          }
        } else {
          this.handlerRegister.addScopedHandler(this.handlerOptionsToHandlerSignature(eventOptions), handler);
        }
      } catch {
        return false;
      }
    }

    return true;
  }

  private handlerOptionsToHandlerSignature(eventOptions: EventOption): EventHandlerSignature {
    if (typeof eventOptions === 'function') {
      return {
        event: eventOptions,
      };
    }
    return {
      event: eventOptions.event,
      routingMetadata: eventOptions.routingMetadata,
    };
  }

  private reflectEventOptions(handler: Type<EventHandler<TEvent>>): EventOption {
    return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
  }
}
