import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem, PermissionStatus } from '@capacitor/filesystem';
import * as XLSX from 'xlsx-js-style';
import { GaslinkSale, GaslinkSalesSummary } from '../gaslink-sales/gaslink-sales.models';

export interface SalesExcelReport {
  sales: GaslinkSale[];
  summary: GaslinkSalesSummary;
  startDate: string;
  endDate: string;
  vendedor: string;
  folio: string;
}
export interface ExcelExportResult { message: string; path?: string }

const NAVY = '101828';
const BLUE = '2563EB';
const BLUE_SOFT = 'EAF2FF';
const BORDER = 'E5EAF1';
const ALT = 'F8FAFC';
const WHITE = 'FFFFFF';
const CURRENCY = '$#,##0.00';
const LITERS = '#,##0.00';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  async exportToExcel(data: unknown[], fileName: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    await this.saveWorkbook(workbook, fileName);
  }

  async exportSalesReport(report: SalesExcelReport, fileName: string): Promise<ExcelExportResult> {
    return this.saveWorkbook(this.buildSalesWorkbook(report), fileName);
  }

  buildSalesWorkbook(report: SalesExcelReport): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, this.buildSummarySheet(report), 'Resumen');
    XLSX.utils.book_append_sheet(workbook, this.buildSalesSheet(report), 'Ventas');
    workbook.Workbook = { Views: [{ RTL: false }] };
    return workbook;
  }

  private buildSummarySheet(report: SalesExcelReport): XLSX.WorkSheet {
    const generated = new Date();
    const rows: unknown[][] = [
      ['Reporte de ventas', ''], ['Periodo', `${report.startDate} al ${report.endDate}`], ['Vendedor', report.vendedor], ['Folio', report.folio],
      ['Generado', generated], [], ['Indicador', 'Valor'], ['Total de ventas', report.summary.count], ['Litros vendidos', report.summary.liters],
      ['Importe total', report.summary.total], ['Ticket promedio', report.summary.average]
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
    sheet['!merges'] = [XLSX.utils.decode_range('A1:B1')];
    sheet['!cols'] = [{ wch: 24 }, { wch: 34 }];
    sheet['!rows'] = [{ hpt: 30 }, ...Array.from({ length: 10 }, () => ({ hpt: 22 }))];
    sheet['!pageSetup'] = { orientation: 'portrait', fitToWidth: 1 };
    this.styleRange(sheet, 'A1:B1', { fill: { fgColor: { rgb: NAVY } }, font: { color: { rgb: WHITE }, bold: true, sz: 18 }, alignment: { vertical: 'center' } });
    this.styleRange(sheet, 'A7:B7', { fill: { fgColor: { rgb: BLUE } }, font: { color: { rgb: WHITE }, bold: true }, alignment: { vertical: 'center' }, border: this.borders() });
    this.styleRange(sheet, 'A2:A5', { fill: { fgColor: { rgb: BLUE_SOFT } }, font: { bold: true, color: { rgb: NAVY } }, border: this.borders() });
    this.styleRange(sheet, 'B2:B5', { border: this.borders() });
    this.styleRange(sheet, 'A8:B11', { border: this.borders() });
    ['A8', 'A9', 'A10', 'A11'].forEach(address => { if (sheet[address]) sheet[address].s = { ...sheet[address].s, fill: { fgColor: { rgb: BLUE_SOFT } }, font: { bold: true } }; });
    if (sheet['B5']) sheet['B5'].z = 'dd/mm/yyyy hh:mm';
    if (sheet['B8']) sheet['B8'].z = '#,##0';
    if (sheet['B9']) sheet['B9'].z = LITERS;
    if (sheet['B10']) sheet['B10'].z = CURRENCY;
    if (sheet['B11']) sheet['B11'].z = CURRENCY;
    return sheet;
  }

  private buildSalesSheet(report: SalesExcelReport): XLSX.WorkSheet {
    const headers = ['Folio', 'Fecha', 'Empresa', 'Vendedor', 'Cliente', 'Forma de pago', 'Litros', 'Total (MXN)'];
    const filterDescription = `Periodo: ${report.startDate} al ${report.endDate} · Vendedor: ${report.vendedor} · Folio: ${report.folio}`;
    const rows: unknown[][] = [['Reporte de ventas', '', '', '', '', '', '', ''], [filterDescription, '', '', '', '', '', '', ''], headers];
    report.sales.forEach(sale => rows.push([sale.folio ?? '', sale.fechaVenta ?? '', sale.empresa ?? '', sale.vendedor ?? '', sale.cliente ?? '', sale.formaPago ?? '', sale.litros ?? '', sale.total ?? '']));
    const totalRow = rows.length + 1;
    rows.push(['Totales', '', '', '', 'Ticket promedio', report.summary.average, { f: `SUM(G4:G${totalRow - 1})` }, { f: `SUM(H4:H${totalRow - 1})` }]);
    const sheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
    sheet['!merges'] = [XLSX.utils.decode_range('A1:H1'), XLSX.utils.decode_range('A2:H2')];
    sheet['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 24 }, { wch: 24 }, { wch: 36 }, { wch: 20 }, { wch: 15 }, { wch: 18 }];
    sheet['!rows'] = [{ hpt: 30 }, { hpt: 24 }, { hpt: 26 }, ...report.sales.map(() => ({ hpt: 20 })), { hpt: 24 }];
    sheet['!autofilter'] = { ref: `A3:H${totalRow - 1}` };
    sheet['!freeze'] = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activePane: 'bottomLeft', state: 'frozen' };
    sheet['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };
    this.styleRange(sheet, 'A1:H1', { fill: { fgColor: { rgb: NAVY } }, font: { color: { rgb: WHITE }, bold: true, sz: 18 }, alignment: { vertical: 'center' } });
    this.styleRange(sheet, 'A2:H2', { fill: { fgColor: { rgb: BLUE_SOFT } }, font: { color: { rgb: NAVY }, italic: true }, alignment: { vertical: 'center' } });
    this.styleRange(sheet, 'A3:H3', { fill: { fgColor: { rgb: NAVY } }, font: { color: { rgb: WHITE }, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: this.borders() });
    for (let row = 4; row < totalRow; row++) {
      this.styleRange(sheet, `A${row}:H${row}`, { fill: { fgColor: { rgb: row % 2 === 0 ? WHITE : ALT } }, border: this.borders(), alignment: { vertical: 'center' } });
      if (sheet[`A${row}`]) sheet[`A${row}`].t = 's';
      if (sheet[`B${row}`] && sheet[`B${row}`].v !== '') { sheet[`B${row}`].t = 'd'; sheet[`B${row}`].z = 'dd/mm/yyyy hh:mm'; }
      if (sheet[`G${row}`] && sheet[`G${row}`].v !== '') sheet[`G${row}`].z = LITERS;
      if (sheet[`H${row}`] && sheet[`H${row}`].v !== '') sheet[`H${row}`].z = CURRENCY;
    }
    this.styleRange(sheet, `A${totalRow}:H${totalRow}`, { fill: { fgColor: { rgb: BLUE_SOFT } }, font: { bold: true, color: { rgb: NAVY } }, border: this.borders(), alignment: { vertical: 'center' } });
    if (sheet[`G${totalRow}`]) sheet[`G${totalRow}`].z = LITERS;
    if (sheet[`H${totalRow}`]) sheet[`H${totalRow}`].z = CURRENCY;
    if (sheet[`F${totalRow}`]) sheet[`F${totalRow}`].z = CURRENCY;
    return sheet;
  }

  private async saveWorkbook(workbook: XLSX.WorkBook, fileName: string): Promise<ExcelExportResult> {
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true, cellDates: true });
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (Capacitor.getPlatform() === 'web') {
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      try { anchor.href = url; anchor.download = `${fileName}.xlsx`; anchor.style.display = 'none'; document.body.appendChild(anchor); anchor.click(); }
      finally { anchor.remove(); URL.revokeObjectURL(url); }
      return { message: 'El archivo Excel se descargó correctamente.' };
    }
    if (!await this.checkPermissions()) throw new Error('FILESYSTEM_PERMISSION_DENIED');
    const path = `${fileName}.xlsx`;
    await Filesystem.writeFile({ path, data: this.arrayBufferToBase64(buffer as ArrayBuffer), directory: Directory.Documents, recursive: true });
    return { message: `Archivo guardado en Documentos/${path}.`, path: `Documentos/${path}` };
  }

  private async checkPermissions(): Promise<boolean> {
    try {
      const status: PermissionStatus = await Filesystem.checkPermissions();
      if (status.publicStorage === 'granted') return true;
      return (await Filesystem.requestPermissions()).publicStorage === 'granted';
    } catch { return false; }
  }
  private styleRange(sheet: XLSX.WorkSheet, range: string, style: XLSX.CellStyle): void {
    const decoded = XLSX.utils.decode_range(range);
    for (let row = decoded.s.r; row <= decoded.e.r; row++) for (let column = decoded.s.c; column <= decoded.e.c; column++) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      if (!sheet[address]) sheet[address] = { t: 's', v: '' };
      sheet[address].s = { ...(sheet[address].s ?? {}), ...style };
    }
  }
  private borders(): XLSX.CellStyle['border'] { const side = { style: 'thin', color: { rgb: BORDER } } as const; return { top: side, bottom: side, left: side, right: side }; }
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer); let binary = ''; const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
    return btoa(binary);
  }
}
