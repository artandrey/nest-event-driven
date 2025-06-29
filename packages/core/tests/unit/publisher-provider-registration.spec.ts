import { ConfigurableModuleOptionsFactory, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GlobalEventPublisher, IEvent, IEventBus, IEventPublisher } from 'packages/core/lib';
import { EventDrivenCore } from 'packages/core/lib/nest/constants';
import { EventDrivenModule } from 'packages/core/lib/nest/event-driven.module';
import { EventDrivenModuleOptions } from 'packages/core/lib/nest/interfaces/event-driven-module-options.interface';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

class TestEvent implements IEvent<object> {
  constructor(public readonly payload: object) {}
}

class TestPublisher implements IEventPublisher<IEvent> {
  publish(): Promise<void> {
    return Promise.resolve();
  }

  publishAll(): Promise<void> {
    return Promise.resolve();
  }
}

class TestPublisherFactory implements ConfigurableModuleOptionsFactory<EventDrivenModuleOptions, 'create'> {
  create(): EventDrivenModuleOptions {
    return {
      eventPublisher: TestPublisher,
    };
  }
}

interface ModuleSetup {
  metadata: ModuleMetadata;
  name: string;
}

const modulesMetadata: ModuleSetup[] = [
  {
    metadata: {
      imports: [
        EventDrivenModule.forRoot({
          eventPublisher: TestPublisher,
        }),
      ],
      providers: [TestPublisher],
    },
    name: 'forRoot',
  },
  {
    metadata: {
      imports: [
        EventDrivenModule.forRootAsync({
          useFactory: () => ({
            eventPublisher: TestPublisher,
          }),
        }),
      ],
      providers: [TestPublisher],
    },
    name: 'forRootAsync',
  },
  {
    metadata: {
      imports: [
        EventDrivenModule.register({
          eventPublisher: TestPublisher,
        }),
      ],
      providers: [TestPublisher],
    },
    name: 'register',
  },
  {
    metadata: {
      imports: [
        EventDrivenModule.registerAsync({
          useFactory: () => ({
            eventPublisher: TestPublisher,
          }),
        }),
      ],
      providers: [TestPublisher],
    },
    name: 'registerAsync',
  },
  {
    metadata: {
      imports: [
        EventDrivenModule.forRootAsync({
          useFactory: () => ({
            eventPublisher: TestPublisher,
          }),
          useClass: TestPublisherFactory,
        }),
      ],
      providers: [TestPublisherFactory, TestPublisher],
    },
    name: 'forRootAsync useClass',
  },
  {
    metadata: {
      imports: [
        EventDrivenModule.registerAsync({
          useFactory: () => ({
            eventPublisher: TestPublisher,
          }),
          useExisting: TestPublisherFactory,
        }),
      ],
      providers: [TestPublisherFactory, TestPublisher],
    },
    name: 'registerAsync useExisting',
  },
];

describe.each(modulesMetadata)('Publisher provider registration as module option: $name', (moduleSetup) => {
  beforeAll(() => {
    vi.spyOn(TestPublisher.prototype, 'publish').mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register publisher passed as injection token of provider registered out of EventDrivenModule', async () => {
    const testingModule = await Test.createTestingModule(moduleSetup.metadata).compile();

    await testingModule.init();

    const eventBus = testingModule.get<IEventBus>(EventDrivenCore.EVENT_BUS);

    eventBus.publish(new TestEvent({}));

    expect(TestPublisher.prototype.publish).toHaveBeenCalled();
  });
});

@GlobalEventPublisher()
class GlobalPublisher implements IEventPublisher<IEvent> {
  publish(): Promise<void> {
    return Promise.resolve();
  }

  publishAll(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Publisher provider registration while another publisher with @GlobalEventPublisher() decorator is present', () => {
  it('should register publisher passed as injection token of provider in favor of global event publisher', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot({ eventPublisher: TestPublisher })],
      providers: [GlobalPublisher, TestPublisher],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get<IEventBus>(EventDrivenCore.EVENT_BUS);

    eventBus.publish(new TestEvent({}));

    expect(TestPublisher.prototype.publish).toHaveBeenCalled();
  });
});
