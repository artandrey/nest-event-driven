import { Module, OnApplicationBootstrap } from '@nestjs/common';

import { EventDrivenCore } from './constants';
import { EventBus } from './event-bus';
import { ExplorerService } from './services/explorer.service';
import { HandlerRegister } from './services/handlers-register.service';

@Module({
  providers: [
    ExplorerService,
    HandlerRegister,
    {
      provide: EventDrivenCore.HANDLER_REGISTER,
      useExisting: HandlerRegister,
    },
    EventBus,
    {
      provide: EventDrivenCore.EVENT_BUS,
      useExisting: EventBus,
    },
  ],
  exports: [EventBus, HandlerRegister, EventDrivenCore.EVENT_BUS, EventDrivenCore.HANDLER_REGISTER],
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
