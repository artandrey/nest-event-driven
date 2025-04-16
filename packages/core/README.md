# Nest Event Driven Core

This package was inspired by [NestJS CQRS](https://github.com/nestjs/cqrs).

> **Important Update**: As of the latest version, this package is now based on [@event-driven-architecture/core](https://www.npmjs.com/package/@event-driven-architecture/core). This dependency provides the core functionality while this package adds NestJS-specific integration.

The main purpose of this package is to provide a core functionality for building event driven architecture in NestJS.
`EventBus` was extended with additional methods to make it possible to extend event routing for specific integrations and enable acknowledgement mechanism for message brokers.

# Disclaimer

This package is still under development and the API may change in further releases.
Documentation may not cover all features.

- [Installation](#installation)
- [Module Registration](#module-registration)
- [Event Handlers](#event-handlers)
- [Event Bus](#event-bus)
- [Core Definitions](#core-definitions)
- [Scoped Handlers with Context](#scoped-handlers-with-context)

## Installation

First, let's install the package using your preferred package manager:

```bash
# Using npm
npm install @nestjs-event-driven/core

# Using yarn
yarn add @nestjs-event-driven/core

# Using pnpm
pnpm add @nestjs-event-driven/core

# Using bun
bun add @nestjs-event-driven/core
```

## Module Registration

To start using event-driven architecture in your NestJS application, import the `EventDrivenModule` into your root module:

```typescript
import { EventDrivenModule } from '@nestjs-event-driven/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    EventDrivenModule,
    // other modules...
  ],
})
export class AppModule {}
```

## Event Handlers

### Creating Events

First, define your events by implementing the `IEvent` interface:

```typescript
import { IEvent } from '@nestjs-event-driven/core';

interface IUserCreatedEventPayload {
  userId: string;
}

export class UserCreatedEvent implements IEvent<IUserCreatedEventPayload> {
  constructor(public readonly payload: IUserCreatedEventPayload) {}
}
```

### Creating Event Handlers

Next, create handlers for your events using the `@EventHandler` decorator:

```typescript
import { EventHandler, IEventHandler } from '@nestjs-event-driven/core';
import { Injectable } from '@nestjs/common';

import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
@EventHandler({ event: UserCreatedEvent })
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent): void {
    const { userId } = event.payload;
    // Handle the event
    console.log(`User created with ID: ${userId}`);
  }
}
```

### Handler Registration

Event handlers are automatically registered during the application bootstrap process. The `EventDrivenModule` uses NestJS's lifecycle hooks to discover and register all event handlers.

> **Note**: Handlers are registered during the `onApplicationBootstrap` lifecycle hook. For more information about NestJS lifecycle hooks, see the [official documentation](https://docs.nestjs.com/fundamentals/lifecycle-events#lifecycle-sequence).

## Event Bus

### Publishing Events

To publish events, inject the `EventBus` into your service:

```typescript
import { EventBus } from '@nestjs-event-driven/core';
import { Injectable } from '@nestjs/common';

import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
export class UserService {
  constructor(private readonly eventBus: EventBus) {}

  createUser(userId: string): void {
    // Business logic...

    // Publish event
    this.eventBus.publish(new UserCreatedEvent({ userId }));
  }
}
```

### Setting Up a Publisher

To set up a publisher that will emit events to a message broker or your personal event flow, you can use one of the provided approaches:

#### Declarative way

Use the `@GlobalEventPublisher` decorator when you have registered EventDrivenModule globally (using the `forRoot` method).
Note that only one provider across the application should be annotated with @GlobalEventPublisher.

```typescript
import { EventBus, IEventPublisher } from '@nestjs-event-driven/core';
import { Module, OnApplicationBootstrap } from '@nestjs/common';

@GlobalEventPublisher()
class MyCustomPublisher implement IEventPublisher {
  // ... your implementation
}

@Module({
  imports: [EventDrivenModule.forRoot()]
  providers: [MyCustomPublisher],
})
export class AppModule {}
```

> **TODO**: This section will be expanded with more stable approaches for setting up publishers in future releases.

### Consuming Events Synchronously

The EventBus provides methods for consuming events synchronously:

```typescript
// Consume by a single handler (throws if multiple handlers exist)
await eventBus.synchronouslyConsumeByStrictlySingleHandler(new UserCreatedEvent({ userId: '123' }));

// Consume by multiple handlers
await eventBus.synchronouslyConsumeByMultipleHandlers(new UserCreatedEvent({ userId: '123' }));
```

## Core Definitions

The event-driven module provides several key definitions:

**Event (IEvent)** - Base interface for all events. Events are simple data structures that contain information about what happened in your application.

**Event Handler (IEventHandler)** - Interface for event handlers. Handlers contain the business logic that should be executed when a specific event occurs.

**Event Bus (IEventBus)** - Core interface for the event bus. The event bus is responsible for publishing events and routing them to the appropriate handlers.

**Event Publisher (IEventPublisher)** - Interface for publishing events to external systems. Publishers are responsible for sending events to external message brokers or other systems.

**Event Subscriber (IEventSubscriber)** - Interface for subscribing to events. Used for in-app synchronous events, similar to an event emitter.

**Handler Register (IHandlerRegister)** - Interface for the handler register service. Responsible for registering handlers and retrieving handler signatures.

## Scoped Handlers with Context

You can create scoped handlers that receive context information:

```typescript
import { EventHandlerScope } from '@nest-event-driven/core';
import { EventHandler, IEventHandler } from '@nestjs-event-driven/core';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { UserCreatedEvent } from './events/user-created.event';

interface IEventContext {
  requestId: string;
}

@Injectable()
@EventHandler({ event: UserCreatedEvent }, { scope: EventHandlerScope.SCOPED })
export class ScopedUserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  constructor(@Inject(REQUEST) private readonly context: IEventContext) {
    // Access request context
    console.log('Request context:', context);
  }

  handle(event: UserCreatedEvent): void {
    // Handle the event with access to request context
    // ...
  }
}
```

When consuming events, you can pass context:

```typescript
await eventBus.synchronouslyConsumeByStrictlySingleHandler(new UserCreatedEvent({ userId: '123' }), {
  context: { requestId: '456' },
});
```
