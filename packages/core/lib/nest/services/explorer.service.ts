import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { IEvent, IEventHandler, IEventPublisher } from '../../core/';
import { EVENTS_HANDLER_METADATA, EVENT_PUBLISHER_METADATA } from '../decorators/constants';

@Injectable()
export class ExplorerService<TEvent extends IEvent = IEvent> {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  explore() {
    const modules = [...this.modulesContainer.values()];

    const events = this.flatMap<IEventHandler<TEvent>>(modules, (instance) =>
      this.filterProvider(instance, EVENTS_HANDLER_METADATA),
    );
    const publishers = this.flatMap<IEventPublisher<TEvent>>(modules, (instance) =>
      this.filterProvider(instance, EVENT_PUBLISHER_METADATA),
    );
    return { events, publishers };
  }

  flatMap<T>(modules: Module[], callback: (instance: InstanceWrapper) => Type<any> | undefined): Type<T>[] {
    const items = modules
      .map((module) => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), []);
    return items.filter((element) => !!element) as Type<T>[];
  }

  filterProvider(wrapper: InstanceWrapper, metadataKey: string): Type<any> | undefined {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return this.extractMetadata(instance, metadataKey);
  }

  extractMetadata(instance: Record<string, any>, metadataKey: string): Type<any> | undefined {
    if (!instance.constructor) {
      return;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
    return metadata ? (instance.constructor as Type<any>) : undefined;
  }
}
