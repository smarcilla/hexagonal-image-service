import { Resolution } from './resolution.value';

describe('Resolution (domain)', () => {
  it('creates a resolution from an allowed width', () => {
    const resolution = Resolution.from('1024');

    expect(resolution.width).toBe('1024');
  });

  it('supports the 800 width option', () => {
    const resolution = Resolution.from('800');

    expect(resolution.width).toBe('800');
  });
});
