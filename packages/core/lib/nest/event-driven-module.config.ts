import { ConfigurableModuleBuilder } from '@nestjs/common';

import { EventDrivenModuleOptions } from './interfaces/event-driven-module-options.interface';

export const { MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<EventDrivenModuleOptions>().setClassMethodName('configure').build();
