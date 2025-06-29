import { EventSignature } from '../../core';

export type EventOption =
  | EventSignature
  | {
      event: EventSignature;
      routingMetadata?: unknown;
    };
