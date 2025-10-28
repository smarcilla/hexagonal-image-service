export class Money {
  public readonly amount: number;

  private constructor(amount: number) {
    this.amount = amount;
  }

  static randomBetween(min = 5, max = 50): Money {
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Money(amount);
  }

  static from(amount: number): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Invalid money amount');
    }
    return new Money(amount);
  }
}
