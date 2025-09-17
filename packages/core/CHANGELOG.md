# @nestjs-event-driven/core

## 0.3.0

### Minor Changes

- f8451cc: Rename IEventDrivenModuleOptions to EventDrivenModuleOptions
- 3113048: Migrate to @event-driven-architecture/core 0.5.0. Rename EventHandler decorator to EventsHandler. Introduce metadata-based routing

## 0.2.0

### Minor Changes

- 49b78a1: Add ability to specify publisher in module options as injection token
- 3964be2: Make event driven module configurable using `forRoot`, `forRootAsync`, `register` and `registerAsync` to define module scope
- 49b78a1: Introduce `@GlobalEventPublisher` decorator to refine event publisher configuration for event bus, by allowing to do this in declarative way

## 0.1.0

### Minor Changes

- b4d24bc: Remove rxjs from peer dependencies
- c8f3d74: Release core
- 5b31c4d: Migrate core to @event-driven-architecture/core package

  This package is now based on [@event-driven-architecture/core](https://www.npmjs.com/package/@event-driven-architecture/core). This dependency provides the core functionality while this package adds NestJS-specific integration.
