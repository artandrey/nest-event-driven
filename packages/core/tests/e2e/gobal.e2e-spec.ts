import { Test } from '@nestjs/testing';
import { EventBus, EventDrivenModule, EventHandler, IEvent, IEventHandler } from 'packages/core/lib';
import { describe, expect, it, vi } from 'vitest';

class TestEvent implements IEvent<object> {
  constructor(public readonly payload: object) {}
}

describe('Global', () => {
  it('consumes single event', async () => {
    const handleConsume = vi.fn();

    @EventHandler({ event: TestEvent })
    class TestEventHandler implements IEventHandler<TestEvent> {
      handle = handleConsume;
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule],
      providers: [TestEventHandler],
    }).compile();
    await testingModule.init();

    const eventBus = testingModule.get(EventBus);

    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}));

    expect(handleConsume).toHaveBeenCalledWith(new TestEvent({}));
  });

  it('throws error in case there are multiple handlers for the same event', async () => {
    @EventHandler({ event: TestEvent })
    class TestEventHandler implements IEventHandler<TestEvent> {
      handle(): void {}
    }

    @EventHandler({ event: TestEvent })
    class TestEventHandler2 implements IEventHandler<TestEvent> {
      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule],
      providers: [TestEventHandler, TestEventHandler2],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get(EventBus);

    await expect(eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}))).rejects.toThrow();
  });

  it('consumes event with multiple handlers', async () => {
    const handleConsume = vi.fn();
    const handleConsume2 = vi.fn();

    @EventHandler({ event: TestEvent })
    class TestEventHandler implements IEventHandler<TestEvent> {
      handle = handleConsume;
    }

    @EventHandler({ event: TestEvent })
    class TestEventHandler2 implements IEventHandler<TestEvent> {
      handle = handleConsume2;
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule],
      providers: [TestEventHandler, TestEventHandler2],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get(EventBus);

    await eventBus.synchronouslyConsumeByMultipleHandlers(new TestEvent({}));

    expect(handleConsume).toHaveBeenCalledWith(new TestEvent({}));
    expect(handleConsume2).toHaveBeenCalledWith(new TestEvent({}));
  });
});
