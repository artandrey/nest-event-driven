import { Inject, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe } from 'node:test';
import { EventDrivenCore, IEventBus, IHandlerRegister } from 'packages/core/lib';
import { EventDrivenModule } from 'packages/core/lib/nest/event-driven.module';
import { expect, it, vi } from 'vitest';

describe('Module Registration', () => {
  it('should register globally and export required providers', async () => {
    const testModule = Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
    });

    const module = await testModule.compile();

    expect(module.get(EventDrivenCore.EVENT_BUS)).toBeDefined();
    expect(module.get(EventDrivenCore.HANDLER_REGISTER)).toBeDefined();
  });

  it('should register in scope of module and export required providers', async () => {
    const testModule = Test.createTestingModule({
      imports: [EventDrivenModule.forRoot()],
    });

    const module = await testModule.compile();

    expect(module.get(EventDrivenCore.EVENT_BUS)).toBeDefined();
    expect(module.get(EventDrivenCore.HANDLER_REGISTER)).toBeDefined();
  });

  it('should register globally asynchronously and export required providers', async () => {
    const testModule = Test.createTestingModule({
      imports: [
        EventDrivenModule.forRootAsync({
          useFactory: () => ({}),
        }),
      ],
    });

    const module = await testModule.compile();

    expect(module.get(EventDrivenCore.EVENT_BUS)).toBeDefined();
    expect(module.get(EventDrivenCore.HANDLER_REGISTER)).toBeDefined();
  });

  it('should register in scope of module asynchronously and export required providers', async () => {
    const testModule = Test.createTestingModule({
      imports: [
        EventDrivenModule.registerAsync({
          useFactory: () => ({}),
        }),
      ],
    });

    const module = await testModule.compile();

    expect(module.get(EventDrivenCore.EVENT_BUS)).toBeDefined();
    expect(module.get(EventDrivenCore.HANDLER_REGISTER)).toBeDefined();
  });
});

describe('Globally registered module', () => {
  it('should make providers available globally', async () => {
    const constructorSpy = vi.fn();

    @Module({})
    class OtherModule {
      constructor(
        @Inject(EventDrivenCore.EVENT_BUS) private readonly eventBus: IEventBus,
        @Inject(EventDrivenCore.HANDLER_REGISTER) private readonly handlerRegister: IHandlerRegister,
      ) {
        constructorSpy(eventBus, handlerRegister);
      }
    }

    const testModule = Test.createTestingModule({
      imports: [EventDrivenModule.forRoot(), OtherModule],
    });

    const module = await testModule.compile();

    expect(constructorSpy).toHaveBeenCalledWith(
      module.get(EventDrivenCore.EVENT_BUS),
      module.get(EventDrivenCore.HANDLER_REGISTER),
    );
  });
});

describe('Locally registered module', () => {
  it('should not make providers available globally', async () => {
    @Module({})
    class OtherModule {
      constructor(
        @Inject(EventDrivenCore.EVENT_BUS) private readonly eventBus: IEventBus,
        @Inject(EventDrivenCore.HANDLER_REGISTER) private readonly handlerRegister: IHandlerRegister,
      ) {}
    }

    const testModule = Test.createTestingModule({
      imports: [EventDrivenModule.register(), OtherModule],
    });

    await expect(testModule.compile()).rejects.toThrow();
  });

  it('should make providers available locally', async () => {
    const testModule = Test.createTestingModule({
      imports: [EventDrivenModule.register()],
    });

    const module = await testModule.compile();

    expect(module.get(EventDrivenCore.EVENT_BUS)).toBeDefined();
    expect(module.get(EventDrivenCore.HANDLER_REGISTER)).toBeDefined();
  });
});
