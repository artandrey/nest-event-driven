import { EventPublisher } from '@event-driven-architecture/core';
import { Type } from '@event-driven-architecture/core';

export class MultiplePublishersFoundException extends Error {
  constructor(publishers: Type<EventPublisher>[]) {
    super(
      `Multiple publishers annotated with @GlobalEventPublisher found: ${publishers.map((p) => p.name).join(', ')}. 
Only one publisher is allowed to be annotated with @GlobalEventPublisher.`,
    );
  }
}
