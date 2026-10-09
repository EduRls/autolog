import { mapGaslinkSale, safeMapsUrl } from './gaslink-sales.models';

describe('mapGaslinkSale enrichment fields', () => {
  it('keeps claveWeb and a trusted Google Maps link', () => {
    const sale = mapGaslinkSale('a', { folio: 'GL-1', claveWeb: 'a1b2c3', mapsUrl: 'https://www.google.com/maps?q=22.77,-102.58' });
    expect(sale.claveWeb).toBe('a1b2c3');
    expect(sale.mapsUrl).toBe('https://www.google.com/maps?q=22.77,-102.58');
  });

  it('treats a missing claveWeb as pending (null) and drops untrusted links', () => {
    const sale = mapGaslinkSale('a', { folio: 'GL-1', mapsUrl: 'javascript:alert(1)' });
    expect(sale.claveWeb).toBeNull();
    expect(sale.mapsUrl).toBeNull();
    expect(safeMapsUrl('https://evil.example/maps?q=1,2')).toBeNull();
    expect(safeMapsUrl('http://www.google.com/maps?q=1,2')).toBeNull();
    expect(safeMapsUrl(undefined)).toBeNull();
  });

  it('no longer exposes fechaGeneracionArchivo', () => {
    expect('fechaGeneracionArchivo' in mapGaslinkSale('a', {})).toBeFalse();
  });
});
