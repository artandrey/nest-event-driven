import { Test } from '@nestjs/testing';
import { EventBus } from 'packages/core/dist';
import { Event, EventDrivenCore, EventDrivenModule, EventHandler, EventsHandler } from 'packages/core/lib';
import { describe, expect, it, vi } from 'vitest';

class TestEvent implements Event<object> {
  constructor(public readonly payload: object) {}
}

describe('Global', () => {
  it('consumes single event', async () => {
    const handleConsume = vi.fn();

    @EventsHandler({ event: TestEvent })
    class TestEventHandler implements EventHandler<TestEvent> {
      handle = handleConsume;
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [TestEventHandler],
    }).compile();
    await testingModule.init();

    const eventBus = testingModule.get<EventBus>(EventDrivenCore.EVENT_BUS);

    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}));

    expect(handleConsume).toHaveBeenCalledWith(new TestEvent({}));
  });

  it('throws error in case there are multiple handlers for the same event', async () => {
    @EventsHandler({ event: TestEvent })
    class TestEventHandler implements EventHandler<TestEvent> {
      handle(): void {}
    }

    @EventsHandler({ event: TestEvent })
    class TestEventHandler2 implements EventHandler<TestEvent> {
      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [TestEventHandler, TestEventHandler2],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get<EventBus>(EventDrivenCore.EVENT_BUS);

    await expect(eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}))).rejects.toThrow();
  });

  it('consumes event with multiple handlers', async () => {
    const handleConsume = vi.fn();
    const handleConsume2 = vi.fn();

    @EventsHandler({ event: TestEvent })
    class TestEventHandler implements EventHandler<TestEvent> {
      handle = handleConsume;
    }

    @EventsHandler({ event: TestEvent })
    class TestEventHandler2 implements EventHandler<TestEvent> {
      handle = handleConsume2;
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [TestEventHandler, TestEventHandler2],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get<EventBus>(EventDrivenCore.EVENT_BUS);

    await eventBus.synchronouslyConsumeByMultipleHandlers(new TestEvent({}));

    expect(handleConsume).toHaveBeenCalledWith(new TestEvent({}));
    expect(handleConsume2).toHaveBeenCalledWith(new TestEvent({}));
  });
});
