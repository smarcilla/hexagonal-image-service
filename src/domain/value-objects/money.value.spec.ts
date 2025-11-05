import { Money } from './money.value';
import { InvalidMoneyError } from '../errors/invalid-money.error';

describe('Money (domain)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates a random amount within the given range', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.75);

    const money = Money.randomBetween(5, 10);

    expect(money.amount).toBe(9);
  });

  it('creates a money instance from a valid amount', () => {
    const money = Money.from(42);

    expect(money.amount).toBe(42);
  });

  it('throws when amount is negative', () => {
    expect(() => Money.from(-1)).toThrow(InvalidMoneyError);
  });

  it('throws when amount is not finite', () => {
    expect(() => Money.from(Number.POSITIVE_INFINITY)).toThrow(
      InvalidMoneyError,
    );
  });
});
