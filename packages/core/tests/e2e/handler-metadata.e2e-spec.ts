import { Test } from '@nestjs/testing';
import {
  Event,
  EventDrivenCore,
  EventDrivenModule,
  EventHandler,
  EventsHandler,
  HandlerRegister,
} from 'packages/core/lib';
import { describe, expect, it } from 'vitest';

describe('Handler Register Metadata', () => {
  it('should return handler metadata', async () => {
    class TestEvent implements Event<object> {
      constructor(public readonly payload: object) {}
    }

    @EventsHandler({ event: TestEvent, routingMetadata: { topic: 'test' } })
    class TestEventHandler implements EventHandler<TestEvent> {
      handle(): void {}
    }

    const testingModule = await Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
      providers: [TestEventHandler],
    }).compile();

    await testingModule.init();

    const handlerRegister = testingModule.get<HandlerRegister>(EventDrivenCore.HANDLER_REGISTER);

    const handlerSignatures = handlerRegister.getHandlerSignatures();

    expect(handlerSignatures).toEqual([{ event: TestEvent, routingMetadata: { topic: 'test' } }]);
  });
});
