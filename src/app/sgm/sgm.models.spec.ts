import { CONSECUTIVO_PATTERN, formatConsecutivo, nextConsecutivo } from './sgm.models';

describe('SGM models', () => {
  it('suggests the first consecutive of the year when there are no records', () => {
    expect(nextConsecutivo([], 2026)).toBe('001/2026');
  });

  it('continues from the highest consecutive of the same year only', () => {
    const registros = [{ consecutivo: '002/2026' }, { consecutivo: '009/2025' }, { consecutivo: '001/2026' }];
    expect(nextConsecutivo(registros, 2026)).toBe('003/2026');
  });

  it('validates the consecutive format', () => {
    expect(CONSECUTIVO_PATTERN.test('001/2026')).toBeTrue();
    expect(CONSECUTIVO_PATTERN.test('1/2026')).toBeFalse();
    expect(CONSECUTIVO_PATTERN.test('001-2026')).toBeFalse();
  });

  it('formats the consecutive with three digits and the year', () => {
    expect(formatConsecutivo(7, 2026)).toBe('007/2026');
  });
});
