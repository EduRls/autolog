import { Timestamp } from '@angular/fire/firestore';
import { mapGaslinkSale, safeDate } from '../../services/gaslink-sales/gaslink-sales.models';
import { customRange, formatLiters, formatMxn, formatSaleDate, presetRange } from './registro-ventas.utils';

describe('RegistroVentas utilities', () => {
  it('maps Firestore documents defensively and preserves duplicate folios by id', () => {
    const first = mapGaslinkSale('one', { folio: 'GL-1', fechaVenta: Timestamp.fromMillis(0), litros: 10, total: 20 });
    const second = mapGaslinkSale('two', { folio: 'GL-1' });
    expect(first.id).toBe('one'); expect(second.id).toBe('two'); expect(second.fechaVenta).toBeNull();
  });

  it('converts Timestamp safely', () => {
    expect(safeDate(Timestamp.fromMillis(1234))?.getTime()).toBe(1234);
    expect(safeDate({ bad: true })).toBeNull();
  });

  it('formats date in America/Mexico_City', () => {
    expect(formatSaleDate(new Date('2026-08-14T13:30:00Z'))).toContain('14/08/2026 07:30');
  });

  it('formats liters and MXN', () => {
    expect(formatLiters(1234.5)).toContain('1,234.50 L');
    expect(formatMxn(1234.5)).toContain('1,234.50');
  });

  it('builds the initial current-day range in Mexico City', () => {
    const range = presetRange('today', new Date('2026-08-15T03:00:00Z'));
    expect(range.startDate).toBe('2026-08-14'); expect(range.endDate).toBe('2026-08-14');
    expect(range.start.toISOString()).toBe('2026-08-14T06:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-08-15T06:00:00.000Z');
  });

  it('starts the default period on January 1 of the current Mexico City year', () => {
    const range = presetRange('all', new Date('2026-08-15T03:00:00Z'));
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-08-14');
    expect(range.start.toISOString()).toBe('2026-01-01T06:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-08-15T06:00:00.000Z');
  });

  it('includes seven complete calendar days in Mexico City', () => {
    const range = presetRange('7days', new Date('2026-08-15T03:00:00Z'));
    expect(range.startDate).toBe('2026-08-08');
    expect(range.endDate).toBe('2026-08-14');
    expect(range.start.toISOString()).toBe('2026-08-08T06:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-08-15T06:00:00.000Z');
  });

  it('applies a custom inclusive range and rejects reversed dates', () => {
    const range = customRange('2026-08-01', '2026-08-14');
    expect(range?.start.toISOString()).toBe('2026-08-01T06:00:00.000Z');
    expect(range?.end.toISOString()).toBe('2026-08-15T06:00:00.000Z');
    expect(customRange('2026-08-15', '2026-08-14')).toBeNull();
  });
});
