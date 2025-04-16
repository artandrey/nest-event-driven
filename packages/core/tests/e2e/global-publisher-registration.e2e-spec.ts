import { IEvent, IEventBus } from '@event-driven-architecture/core';
import { Test } from '@nestjs/testing';
import { EventDrivenCore, EventDrivenModule, IEventPublisher } from 'packages/core/lib';
import { GlobalEventPublisher } from 'packages/core/lib/nest/decorators/event-publisher.decorator';
import { describe, expect, it, vi } from 'vitest';

describe('Global publisher injection', () => {
  it('should use annotated publisher if present', async () => {
    class TestEvent implements IEvent<object> {
      constructor(public readonly payload: object) {}
    }

    @GlobalEventPublisher()
    class TestPublisher implements IEventPublisher<IEvent> {
      publish(): Promise<void> {
        return Promise.resolve();
      }

      publishAll(): Promise<void> {
        return Promise.resolve();
      }
    }

    vi.spyOn(TestPublisher.prototype, 'publish').mockResolvedValue();

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [TestPublisher],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get<IEventBus>(EventDrivenCore.EVENT_BUS);

    eventBus.publish(new TestEvent({}));

    expect(TestPublisher.prototype.publish).toHaveBeenCalled();
  });
});
