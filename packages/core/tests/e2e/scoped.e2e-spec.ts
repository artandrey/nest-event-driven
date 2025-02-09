import { Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe } from 'node:test';
import { EventBus, EventDrivenModule, EventHandler, IEvent, IEventHandler } from 'packages/core/lib';
import { expect, vi } from 'vitest';
import { it } from 'vitest';

class TestEvent implements IEvent<object> {
  constructor(public readonly payload: object) {}
}

describe('Scoped', () => {
  it('creates handler for each event', async () => {
    const constructorHandler = vi.fn();

    @EventHandler({ event: TestEvent }, { scope: Scope.REQUEST })
    class ScopedTestEventHandler implements IEventHandler<TestEvent> {
      constructor(@Inject(REQUEST) private readonly request: any) {
        constructorHandler(request);
      }

      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule],
      providers: [ScopedTestEventHandler],
    }).compile();

    await testingModule.init();

    const eventBus = testingModule.get(EventBus);

    const contextA = { a: 1 };
    const contextB = { b: 2 };

    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}), { context: contextA });
    await eventBus.synchronouslyConsumeByStrictlySingleHandler(new TestEvent({}), { context: contextB });

    expect(constructorHandler).toHaveBeenCalledWith(contextA);
    expect(constructorHandler).toHaveBeenCalledWith(contextB);
  });
});
