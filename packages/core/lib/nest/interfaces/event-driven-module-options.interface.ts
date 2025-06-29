import { InjectionToken } from '@nestjs/common';

export interface EventDrivenModuleOptions {
  eventPublisher?: InjectionToken;
}
