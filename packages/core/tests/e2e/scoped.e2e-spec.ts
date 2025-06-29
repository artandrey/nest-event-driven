import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe } from 'node:test';
import {
  Event,
  EventBus,
  EventDrivenCore,
  EventDrivenModule,
  EventHandler,
  EventHandlerScope,
  EventsHandler,
} from 'packages/core/lib';
import { expect, it, vi } from 'vitest';

class TestEvent implements Event<object> {
  constructor(public readonly payload: object) {}
}

describe('Scoped', () => {
  it('creates handler for each event', async () => {
    const constructorHandler = vi.fn();

    @EventsHandler({ event: TestEvent }, { scope: EventHandlerScope.SCOPED })
    class ScopedTestEventHandler implements EventHandler<TestEvent> {
      constructor(@Inject(REQUEST) private readonly request: any) {
        constructorHandler(request);
      }

      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [ScopedTestEventHandler],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get<EventBus>(EventDrivenCore.EVENT_BUS);

    const contextA = { a: 1 };
    const contextB = { b: 2 };

    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}), { context: contextA });
    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}), { context: contextB });

    expect(constructorHandler).toHaveBeenCalledWith(contextA);
    expect(constructorHandler).toHaveBeenCalledWith(contextB);
  });
});
