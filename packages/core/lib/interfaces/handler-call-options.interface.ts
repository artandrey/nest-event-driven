export interface IHandlerCallOptions<TContext extends object = object> {
  matchingKey?: string;
  context?: TContext;
}
