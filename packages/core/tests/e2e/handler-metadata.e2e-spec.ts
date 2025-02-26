import { Test } from '@nestjs/testing';
import {
  EventDrivenCore,
  EventDrivenModule,
  EventHandler,
  IEvent,
  IEventHandler,
  IHandlerRegister,
} from 'packages/core/lib';
import { describe, expect, it } from 'vitest';

describe('Handler Register Metadata', () => {
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

    const handlerRegister = testingModule.get<IHandlerRegister>(EventDrivenCore.HANDLER_REGISTER);

    const handlerSignatures = handlerRegister.getHandlerSignatures();

    expect(handlerSignatures).toEqual([{ event: TestEvent, metadata: { test: 'test' } }]);
  });
});
