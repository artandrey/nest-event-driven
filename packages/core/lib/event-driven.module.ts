import { Module, OnApplicationBootstrap } from '@nestjs/common';

import { EventDrivenCore } from './constants';
import { EventBus } from './event-bus';
import { BaseHandlerRegister } from './services/base-handlers-register.service';
import { ExplorerService } from './services/explorer.service';
import { HandlerRegistrar } from './services/handler-registrar.service';
import { NestJsHandlerRegister } from './services/nest-js-handler-register.service';

@Module({
  providers: [
    ExplorerService,
    {
      provide: BaseHandlerRegister,
      useClass: NestJsHandlerRegister,
    },
    {
      provide: EventDrivenCore.HANDLER_REGISTER,
      useExisting: BaseHandlerRegister,
    },
    HandlerRegistrar,
    EventBus,
    {
      provide: EventDrivenCore.EVENT_BUS,
      useExisting: EventBus,
    },
  ],
  exports: [
    EventBus,
    BaseHandlerRegister,
    HandlerRegistrar,
    EventDrivenCore.EVENT_BUS,
    EventDrivenCore.HANDLER_REGISTER,
  ],
})
export class EventDrivenModule implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly eventBus: EventBus,
  ) {}

  onApplicationBootstrap() {
    const { events } = this.explorerService.explore();

    this.eventBus.register(events);
  }
}
