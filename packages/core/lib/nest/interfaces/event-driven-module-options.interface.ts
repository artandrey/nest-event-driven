import { InjectionToken } from '@nestjs/common';

export interface IEventDrivenModuleOptions {
  eventPublisher?: InjectionToken;
}
