import { Injectable, Scope } from '@nestjs/common';
import 'reflect-metadata';

import {
  EventHandlerProviderOptions,
  EventHandlerScope,
  EventOption,
} from '../../core/interfaces/event-handler.interface';
import { EVENTS_HANDLER_METADATA } from './constants';

export function EventHandler(
  events: EventOption | EventOption[],
  options: EventHandlerProviderOptions = { scope: EventHandlerScope.SINGLETON },
): ClassDecorator {
  return (target: any) => {
    if (Array.isArray(events)) {
      Reflect.defineMetadata(EVENTS_HANDLER_METADATA, events, target);
    } else {
      Reflect.defineMetadata(EVENTS_HANDLER_METADATA, [events], target);
    }

    // Map EventHandlerScope to NestJS Scope
    const nestScope = options.scope === EventHandlerScope.SCOPED ? Scope.REQUEST : Scope.DEFAULT;
    Injectable({ scope: nestScope })(target);
  };
}
