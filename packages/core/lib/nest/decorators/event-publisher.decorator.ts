import { Injectable } from '@nestjs/common';
import 'reflect-metadata';

import { EVENT_PUBLISHER_METADATA } from './constants';

export function GlobalEventPublisher(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_PUBLISHER_METADATA, true, target);

    Injectable()(target);
  };
}
