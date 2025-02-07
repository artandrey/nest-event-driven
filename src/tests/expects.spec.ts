import { add } from '~lib/index';

describe('package test', () => {
  it('should add', () => {
    expect(add(1, 2)).toBe(3);
  });
});
