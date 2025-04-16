import { DynamicModule, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { EventBus } from '../core';
import { IHandlerRegister } from '../core';
import { EventDrivenCore } from './constants';
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from './event-driven-module.config';
import { MultiplePublishersFoundException } from './exceptions/multiple-publishers-found.exception';
import { IEventDrivenModuleOptions } from './interfaces/event-driven-module-options.interface';
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
export class EventDrivenModule extends ConfigurableModuleClass implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly handlerRegistrar: HandlerRegistrar,
    @Inject(EventDrivenCore.EVENT_BUS) private readonly eventBus: EventBus,
    private moduleRef: ModuleRef,
  ) {
    super();
  }

  async onApplicationBootstrap() {
    const { events, publishers } = this.explorerService.explore();

    this.handlerRegistrar.register(events);
    if (publishers.length > 1) {
      throw new MultiplePublishersFoundException(publishers);
    }

    if (publishers[0]) {
      const publisher = this.moduleRef.get(publishers[0], { strict: false });
      this.eventBus.publisher = publisher;
    }
  }

  static forRoot(options?: IEventDrivenModuleOptions): DynamicModule {
    return {
      module: EventDrivenModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
      global: true,
    };
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const { imports = [], exports = [], providers = [] } = super.register(options);

    return {
      module: EventDrivenModule,
      imports: [...imports],
      exports: [...exports],
      providers: [...providers],
      global: true,
    };
  }

  static register(options?: IEventDrivenModuleOptions): DynamicModule {
    return {
      module: EventDrivenModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
      global: false,
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const { imports = [], exports = [], providers = [] } = super.register(options);
    return {
      module: EventDrivenModule,
      imports: [...imports],
      exports: [...exports],
      providers: [...providers],
      global: false,
    };
  }
}
