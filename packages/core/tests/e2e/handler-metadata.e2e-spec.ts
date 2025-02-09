import { Test } from '@nestjs/testing';
import { EventBus, EventDrivenModule, IEvent, IEventHandler } from 'packages/core/lib';
import { EventHandler } from 'packages/core/lib/decorators/event-handler.decorator';
import { describe, expect, it } from 'vitest';

describe('Event Bus Handler Metadata', () => {
  it('should return handler metadata', async () => {
    class TestEvent implements IEvent<object> {
      constructor(public readonly payload: object) {}
    }

    @EventHandler({ event: TestEvent, metadata: { test: 'test' } })
    class TestEventHandler implements IEventHandler<TestEvent> {
      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule],
      providers: [TestEventHandler],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get(EventBus);

    const handlerSignatures = eventBus.getHandlerSignatures();

    expect(handlerSignatures).toEqual([{ event: TestEvent, metadata: { test: 'test' } }]);
  });
});
