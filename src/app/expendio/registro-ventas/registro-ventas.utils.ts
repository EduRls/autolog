export type PeriodPreset = 'all' | 'today' | '7days' | '30days' | 'custom';
export const SALES_TIME_ZONE = 'America/Mexico_City';

function zonedInstant(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  let instant = target;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: SALES_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(parts['year']), Number(parts['month']) - 1, Number(parts['day']), Number(parts['hour']), Number(parts['minute']), Number(parts['second']));
    instant += target - represented;
  }
  return new Date(instant);
}

function nextDateInput(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [next.getUTCFullYear(), String(next.getUTCMonth() + 1).padStart(2, '0'), String(next.getUTCDate()).padStart(2, '0')].join('-');
}

export function dateInputInMexico(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SALES_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function presetRange(preset: Exclude<PeriodPreset, 'custom'>, now = new Date()): { startDate: string; endDate: string; start: Date; end: Date } {
  const endDate = dateInputInMexico(now);
  if (preset === 'all') {
    const startDate = `${endDate.slice(0, 4)}-01-01`;
    return { startDate, endDate, start: zonedInstant(startDate), end: zonedInstant(nextDateInput(endDate)) };
  }
  const days = preset === 'today' ? 0 : preset === '7days' ? 6 : 29;
  const noon = zonedInstant(endDate);
  noon.setUTCDate(noon.getUTCDate() - days);
  const startDate = dateInputInMexico(noon);
  return { startDate, endDate, start: zonedInstant(startDate), end: zonedInstant(nextDateInput(endDate)) };
}

export function customRange(startDate: string, endDate: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) return null;
  return { start: zonedInstant(startDate), end: zonedInstant(nextDateInput(endDate)) };
}

export const formatSaleDate = (value: Date | null): string => value ? new Intl.DateTimeFormat('es-MX', {
  timeZone: SALES_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
}).format(value).replace(',', '') : '—';
export const formatLiters = (value: number | null): string => value === null ? '—' : `${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} L`;
export const formatMxn = (value: number | null): string => value === null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
