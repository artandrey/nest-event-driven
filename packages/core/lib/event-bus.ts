import { Injectable, OnModuleDestroy, Type } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { EVENTS_HANDLER_METADATA } from './decorators/constants';
import { HandlerNotFoundException, MultipleHandlersFoundException, PublisherNotSetException } from './exceptions';
import { defaultGetEventName } from './helpers/default-get-event-name';
import { IEventBus } from './interfaces/event-bus.interface';
import { IEventHandler } from './interfaces/event-handler.interface';
import { IEventPublisher } from './interfaces/event-publisher.interface';
import { IEvent } from './interfaces/event.interface';
import { IHandlerCallOptions } from './interfaces/handler-call-options.interface';
import { HandlerRegistrar } from './services/handler-registrar.service';
import { HandlerRegister } from './services/handlers-register.service';
import { ObservableBus } from './utils/observable-bus';

export type EventHandlerType<TEvent extends IEvent = IEvent> = Type<IEventHandler<TEvent>>;

@Injectable()
export class EventBus<TEvent extends IEvent = IEvent>
  extends ObservableBus<TEvent>
  implements IEventBus<TEvent>, OnModuleDestroy
{
  protected readonly subscriptions: Subscription[];

  protected _pubsub: IEventPublisher | null = null;

  constructor(
    private readonly handlersRegister: HandlerRegister<IEventHandler<TEvent>>,
    private readonly handlerRegistrar: HandlerRegistrar<TEvent>,
  ) {
    super();
    this.subscriptions = [];
  }

  get publisher(): IEventPublisher {
    if (!this._pubsub) {
      throw new PublisherNotSetException();
    }
    return this._pubsub;
  }

  set publisher(_publisher: IEventPublisher) {
    this._pubsub = _publisher;
  }

  onModuleDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  publish<T extends TEvent>(event: T) {
    if (!this._pubsub) {
      throw new PublisherNotSetException();
    }
    return this._pubsub.publish(event);
  }

  publishAll<T extends TEvent>(events: T[]) {
    if (!this._pubsub) {
      throw new PublisherNotSetException();
    }

    if (this._pubsub.publishAll) {
      return this._pubsub.publishAll(events);
    }
    return (events || []).map((event) => this._pubsub!.publish(event));
  }

  protected getEventName(event: TEvent) {
    return defaultGetEventName(event);
  }

  public bind(name: string) {
    const stream$ = name ? this.ofEventName(name) : this.subject$;
    const subscription = stream$.subscribe(async (event) => {
      const instances = await this.handlersRegister.get(event);
      instances?.forEach((instance) => instance.handle(event));
    });
    this.subscriptions.push(subscription);
  }

  public register(handlers: EventHandlerType<TEvent>[] = []) {
    this.handlerRegistrar.register(handlers);
  }

  async synchronouslyConsumeByStrictlySingleHandler(event: TEvent, options?: IHandlerCallOptions): Promise<void> {
    const handlers = await this.handlersRegister.get(event, options?.context);

    if (!handlers || handlers.length === 0) {
      throw new HandlerNotFoundException();
    }
    if (handlers.length !== 1) {
      throw new MultipleHandlersFoundException();
    }
    return handlers[0].handle(event);
  }

  async synchronouslyConsumeByMultipleHandlers(event: TEvent, options?: IHandlerCallOptions): Promise<void> {
    const handlers = await this.handlersRegister.get(event, options?.context);
    if (!handlers || handlers.length === 0) {
      throw new HandlerNotFoundException();
    }
    return handlers.forEach((handler) => handler.handle(event));
  }

  protected registerHandler(handler: EventHandlerType<TEvent>) {
    return this.handlerRegistrar.register([handler]);
  }

  protected ofEventName(name: string) {
    return this.subject$.pipe(filter((event) => this.getEventName(event) === name));
  }

  private reflectEventsNames(handler: EventHandlerType<TEvent>): FunctionConstructor[] {
    return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
  }
}
