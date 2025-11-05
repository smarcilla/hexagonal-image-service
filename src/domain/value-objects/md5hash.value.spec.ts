import { Md5Hash } from './md5hash.value';
import { InvalidMd5HashError } from '../errors/invalid-md5-hash.error';

describe('Md5Hash (domain)', () => {
  it('normalizes the hash to lowercase', () => {
    const uppercase = 'A'.repeat(32);
    const hash = Md5Hash.from(uppercase);

    expect(hash.value).toBe('a'.repeat(32));
  });

  it('throws when the hash does not match md5 format', () => {
    expect(() => Md5Hash.from('invalid-md5')).toThrow(InvalidMd5HashError);
  });
});
