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
    EventDrivenModule.forRoot(),
    // other modules...
  ],
})
export class AppModule {}
```

You can also use the `register` method for non-global registration:

```typescript
import { EventDrivenModule } from '@nestjs-event-driven/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    EventDrivenModule.register(),
    // other modules...
  ],
})
export class FeatureModule {}
```

## Event Handlers

### Event Options

The `@EventsHandler` decorator accepts either a single event option or an array of event options. Each event option can be:

- A simple event class (for basic usage)
- An object with `event` and optional `routingMetadata` properties (for advanced routing)

```typescript
import { EventOption } from '@nestjs-event-driven/core';

// Simple event option
const simpleOption: EventOption = UserCreatedEvent;

// Advanced event option with routing metadata
const advancedOption: EventOption = {
  event: UserCreatedEvent,
  routingMetadata: {
    topic: 'user-events',
    partition: 'created',
  },
};
```

### Creating Events

First, define your events by implementing the `Event` interface:

```typescript
import { Event } from '@nestjs-event-driven/core';

interface UserCreatedEventPayload {
  userId: string;
}

export class UserCreatedEvent implements Event<UserCreatedEventPayload> {
  constructor(public readonly payload: UserCreatedEventPayload) {}
}
```

### Creating Event Handlers

Next, create handlers for your events using the `@EventsHandler` decorator:

```typescript
import { EventHandler, EventsHandler } from '@nestjs-event-driven/core';
import { Injectable } from '@nestjs/common';

import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
@EventsHandler({ event: UserCreatedEvent })
export class UserCreatedEventHandler implements EventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent): void {
    const { userId } = event.payload;
    // Handle the event
    console.log(`User created with ID: ${userId}`);
  }
}
```

> **Note**: For simple cases without routing metadata, you can also pass the event class directly:
>
> ```typescript
> @EventsHandler(UserCreatedEvent)
> ```

#### Handling Multiple Events

The `@EventsHandler` decorator also supports handling multiple events with a single handler:

```typescript
import { EventHandler, EventsHandler } from '@nestjs-event-driven/core';
import { Injectable } from '@nestjs/common';

import { UserCreatedEvent } from './events/user-created.event';
import { UserUpdatedEvent } from './events/user-updated.event';

@Injectable()
@EventsHandler([{ event: UserCreatedEvent }, { event: UserUpdatedEvent }])
export class UserEventHandler implements EventHandler<UserCreatedEvent | UserUpdatedEvent> {
  handle(event: UserCreatedEvent | UserUpdatedEvent): void {
    if (event instanceof UserCreatedEvent) {
      // Handle user creation
    } else if (event instanceof UserUpdatedEvent) {
      // Handle user update
    }
  }
}
```

#### Event Routing Metadata

You can also provide routing metadata for events, which can be useful for message brokers or custom routing logic:

```typescript
@Injectable()
@EventsHandler({
  event: UserCreatedEvent,
  routingMetadata: {
    topic: 'user-events',
    partition: 'user-created',
  },
})
export class UserCreatedEventHandler implements EventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent): void {
    // Handle the event
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

#### Option 1: Using Module Options

The recommended approach is to provide the publisher using the `eventPublisher` option when configuring the module:

```typescript
import { EventDrivenModule, EventPublisher } from '@nestjs-event-driven/core';
import { Module } from '@nestjs/common';

@Injectable()
class MyCustomPublisher implements EventPublisher {
  // ... your implementation
}

@Module({
  imports: [
    EventDrivenModule.forRoot({
      eventPublisher: MyCustomPublisher,
    }),
  ],
  providers: [MyCustomPublisher],
})
export class AppModule {}
```

You can also use `forRootAsync` for dynamic configuration:

```typescript
import { EventDrivenModule } from '@nestjs-event-driven/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    EventDrivenModule.forRootAsync({
      useFactory: () => ({
        eventPublisher: MyCustomPublisher,
      }),
    }),
  ],
  providers: [MyCustomPublisher],
})
export class AppModule {}
```

#### Option 2: Declarative way

Alternatively, you can use the `@GlobalEventPublisher` decorator when you have registered EventDrivenModule globally:

```typescript
import { EventBus, EventPublisher, GlobalEventPublisher } from '@nestjs-event-driven/core';
import { Module } from '@nestjs/common';

@GlobalEventPublisher()
class MyCustomPublisher implements EventPublisher {
  // ... your implementation
}

@Module({
  imports: [EventDrivenModule.forRoot()],
  providers: [MyCustomPublisher],
})
export class AppModule {}
```

> **Note**: When both approaches are used, the `eventPublisher` option takes precedence over the `@GlobalEventPublisher` decorator. Only one provider across the application should be annotated with `@GlobalEventPublisher`.

> **Note**: When using the `eventPublisher` option, provide the class token (not an instance) of your publisher implementation. The module will resolve and instantiate it automatically.

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

**Event (Event)** - Base interface for all events. Events are simple data structures that contain information about what happened in your application.

**Event Handler (EventHandler)** - Interface for event handlers. Handlers contain the business logic that should be executed when a specific event occurs.

**Event Bus (EventBus)** - Core interface for the event bus. The event bus is responsible for publishing events and routing them to the appropriate handlers.

**Event Publisher (EventPublisher)** - Interface for publishing events to external systems. Publishers are responsible for sending events to external message brokers or other systems.

**Event Subscriber (EventSubscriber)** - Interface for subscribing to events. Used for in-app synchronous events, similar to an event emitter.

**Handler Register (HandlerRegister)** - Interface for the handler register service. Responsible for registering handlers and retrieving handler signatures.

## Scoped Handlers with Context

You can create scoped handlers that receive context information:

```typescript
import { EventHandlerScope } from '@nestjs-event-driven/core';
import { EventHandler, EventsHandler } from '@nestjs-event-driven/core';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { UserCreatedEvent } from './events/user-created.event';

interface EventContext {
  requestId: string;
}

@Injectable()
@EventsHandler({ event: UserCreatedEvent }, { scope: EventHandlerScope.SCOPED })
export class ScopedUserCreatedEventHandler implements EventHandler<UserCreatedEvent> {
  constructor(@Inject(REQUEST) private readonly context: EventContext) {
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
