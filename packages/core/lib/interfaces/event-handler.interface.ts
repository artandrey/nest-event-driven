import { Scope } from '@nestjs/common';

import { IEvent } from './event.interface';

export type EventSignature = new (...args: any[]) => IEvent;
export type EventOption =
  | EventSignature
  | {
      event: EventSignature;
      metadata?: unknown;
    };

export interface EventHandlerProviderOptions {
  scope?: Scope;
}

export interface IEventHandler<TEvent extends IEvent, TContext = void> {
  handle(event: TEvent, context: TContext): void;
}
