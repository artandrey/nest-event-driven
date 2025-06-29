import { DynamicModule, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { BaseEventBus, HandlerRegister } from '../core';
import { EventDrivenCore } from './constants';
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from './event-driven-module.config';
import { MultiplePublishersFoundException } from './exceptions/multiple-publishers-found.exception';
import type { EventDrivenModuleOptions } from './interfaces';
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
      useFactory: (handlerRegister: HandlerRegister) => new BaseEventBus(handlerRegister),
      inject: [EventDrivenCore.HANDLER_REGISTER],
    },
  ],
  exports: [HandlerRegistrar, EventDrivenCore.EVENT_BUS, EventDrivenCore.HANDLER_REGISTER],
})
export class EventDrivenModule extends ConfigurableModuleClass implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly handlerRegistrar: HandlerRegistrar,
    private readonly moduleRef: ModuleRef,
    @Inject(EventDrivenCore.EVENT_BUS) private readonly eventBus: BaseEventBus,
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: EventDrivenModuleOptions = {},
  ) {
    super();
  }

  async onApplicationBootstrap() {
    const { events, publishers } = this.explorerService.explore();

    this.handlerRegistrar.register(events);

    if (this.options.eventPublisher) {
      this.eventBus.publisher = this.moduleRef.get(this.options.eventPublisher, { strict: false });
      return;
    }

    if (publishers.length > 1) {
      throw new MultiplePublishersFoundException(publishers);
    }

    if (publishers[0]) {
      const publisher = this.moduleRef.get(publishers[0], { strict: false });
      this.eventBus.publisher = publisher;
    }
  }

  static forRoot(options?: EventDrivenModuleOptions): DynamicModule {
    return {
      module: EventDrivenModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
      exports: [MODULE_OPTIONS_TOKEN],
      global: true,
    };
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const { imports = [], exports = [], providers = [], controllers = [] } = super.configureAsync(options);

    return {
      module: EventDrivenModule,
      imports: [...imports],
      exports: [...exports],
      providers: [...providers],
      controllers: [...controllers],
      global: true,
    };
  }

  static register(options?: EventDrivenModuleOptions): DynamicModule {
    return {
      module: EventDrivenModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
      exports: [MODULE_OPTIONS_TOKEN],
      global: false,
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const { imports = [], exports = [], providers = [], controllers = [] } = super.configureAsync(options);
    return {
      module: EventDrivenModule,
      imports: [...imports],
      exports: [...exports],
      providers: [...providers],
      controllers: [...controllers],
      global: false,
    };
  }
}
