import { Type } from '@nestjs/common';

import { IEventHandlerSignature } from './handler-signature.interface';

/**
 * Handler register service that manages event handlers.
 * Responsible for registering handlers and retrieving handler signatures.
 * @template T The handler type
 * @template TypeT The handler class type
 */
export interface IHandlerRegister<T = unknown, TypeT extends Type<T> = Type<T>> {
  /**
   * Registers a handler for events.
   * @param handler The handler to register
   * @returns A boolean indicating whether the registration was successful
   */
  registerHandler(handler: TypeT): boolean;

  /**
   * Gets handlers for a specific event.
   * @param event The event to get handlers for
   * @param context Optional context for scoped handlers
   * @returns A promise that resolves to an array of handlers or undefined
   */
  get<E>(event: E, context?: object): Promise<T[] | undefined>;

  /**
   * Gets the name of an event.
   * @param event The event to get the name for
   * @returns The name of the event
   */
  getName<E>(event: E): string;

  /**
   * Gets the signatures of all registered handlers.
   * @returns A readonly array of handler signatures
   */
  getHandlerSignatures(): Readonly<IEventHandlerSignature[]>;
}
