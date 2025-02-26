import { Module, OnApplicationBootstrap } from '@nestjs/common';

import { IHandlerRegister } from '../core';
import { EventBus } from '../core/services/event-bus';
import { EventDrivenCore } from './constants';
import { ExplorerService } from './services/explorer.service';
import { HandlerRegistrar } from './services/handler-registrar.service';
import { NestJsHandlerRegister } from './services/nest-js-handler-register.service';

@Module({
  providers: [
    ExplorerService,
    {
      provide: EventDrivenCore.HANDLER_REGISTER,
      useClass: NestJsHandlerRegister,
    },
    HandlerRegistrar,
    {
      provide: EventDrivenCore.EVENT_BUS,
      useFactory: (handlerRegister: IHandlerRegister) => new EventBus(handlerRegister),
      inject: [EventDrivenCore.HANDLER_REGISTER],
    },
  ],
  exports: [HandlerRegistrar, EventDrivenCore.EVENT_BUS, EventDrivenCore.HANDLER_REGISTER],
})
export class EventDrivenModule implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly handlerRegistrar: HandlerRegistrar,
  ) {}

  onApplicationBootstrap() {
    const { events } = this.explorerService.explore();

    this.handlerRegistrar.register(events);
  }
}
