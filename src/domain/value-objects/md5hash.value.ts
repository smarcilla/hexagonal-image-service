import { InvalidMd5HashError } from '../errors/invalid-md5-hash.error';

export class Md5Hash {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static from(value: string): Md5Hash {
    if (!/^[a-f0-9]{32}$/i.test(value)) {
      throw new InvalidMd5HashError('Invalid MD5 hash');
    }
    return new Md5Hash(value.toLowerCase());
  }
}
