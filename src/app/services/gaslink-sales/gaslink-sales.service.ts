import { Injectable } from '@angular/core';
import { Firestore, QueryConstraint, collection, documentId, getDocs, limit, orderBy, query, startAfter, where } from '@angular/fire/firestore';
import { GaslinkSale, GaslinkSalesFilters, GaslinkSalesPage, mapGaslinkSale } from './gaslink-sales.models';
import { DocumentSnapshot } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class GaslinkSalesService {
  constructor(private readonly firestore: Firestore) {}

  async getSales(filters: GaslinkSalesFilters, pageSize: number, cursor?: DocumentSnapshot): Promise<GaslinkSalesPage> {
    const constraints: QueryConstraint[] = [
      where('fechaVenta', '>=', filters.startDate), where('fechaVenta', '<', filters.endDate),
      ...(filters.folio ? [where('folio', '==', filters.folio)] : []),
      ...(filters.vendedor ? [where('vendedor', '==', filters.vendedor)] : []),
      orderBy('fechaVenta', 'desc'), orderBy(documentId(), 'desc'),
      ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)
    ];
    const snapshot = await getDocs(query(collection(this.firestore, 'ventas_gaslink'), ...constraints));
    const visible = snapshot.docs.slice(0, pageSize);
    const sales = visible.map(item => mapGaslinkSale(item.id, item.data()));
    if (!environment.production) {
      sales.filter(sale => !sale.folio || !sale.fechaVenta).forEach(sale => console.warn('Venta GasLink incompleta:', sale.id));
    }
    return {
      sales,
      lastVisible: visible.at(-1) ?? null,
      hasMore: snapshot.docs.length > pageSize
    };
  }

  async getAnalytics(filters: GaslinkSalesFilters, maximum = 10000): Promise<GaslinkSale[]> {
    const sales: GaslinkSale[] = [];
    let cursor: DocumentSnapshot | undefined;
    do {
      const batch = await this.getSales(filters, Math.min(500, maximum - sales.length), cursor);
      sales.push(...batch.sales);
      cursor = batch.lastVisible ?? undefined;
      if (!batch.hasMore) return sales;
    } while (cursor && sales.length < maximum);
    throw new Error('ANALYTICS_LIMIT_EXCEEDED');
  }
}
