import { Component, ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-convertidor-dictamen',
  templateUrl: './convertidor-dictamen.page.html',
  styleUrls: ['./convertidor-dictamen.page.scss'],
})
export class ConvertidorDictamenPage {
  nombreArchivoOriginal: string = 'dictamen';
  jsonPreview: any = null;
  jsonEditable: string = '';
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(private toastCtrl: ToastController) { }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color, position: 'bottom' });
    toast.present();
  }

  abrirSelector() { this.fileInput.nativeElement.click(); }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.nombreArchivoOriginal = file.name.replace(/\.[^/.]+$/, '');
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx'].includes(fileExtension || '')) return void this.mostrarToast('El archivo debe ser .xls o .xlsx', 'danger');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        this.jsonPreview = this.convertirAJSON(workbook);
        this.jsonEditable = JSON.stringify(this.jsonPreview, null, 2);
        this.mostrarToast('Archivo cargado correctamente');
      } catch (err) {
        console.error(err);
        this.mostrarToast('Error al leer el archivo', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private cleanText(value: any): string | null {
    if (value === null || value === undefined) return null;
    const txt = String(value).replace(/\s+/g, ' ').trim();
    return txt.length ? txt : null;
  }


  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;
    const cleaned = String(value).replace(/,/g, '').trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }

  private excelDateToISO(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return XLSX.SSF.format('yyyy-mm-dd', value);
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    const asString = this.cleanText(value);
    if (!asString) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
    const parsed = new Date(asString);
    return Number.isNaN(parsed.getTime()) ? asString : parsed.toISOString().slice(0, 10);
  }

  private getMergedValue(sheet: XLSX.WorkSheet, range: string): any {
    const firstCell = range.split(':')[0];
    return sheet?.[firstCell]?.v ?? null;
  }

  private concatRange(sheet: XLSX.WorkSheet, range: string): string | null {
    const decoded = XLSX.utils.decode_range(range);
    const parts: string[] = [];
    for (let r = decoded.s.r; r <= decoded.e.r; r++) {
      for (let c = decoded.s.c; c <= decoded.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const v = sheet?.[addr]?.v;
        if (v === null || v === undefined || v === '') continue;
        if (typeof v === 'number') parts.push(Math.trunc(v).toString());
        else parts.push(String(v).trim());
      }
    }
    const out = parts.join('').replace(/\s+/g, ' ').trim();
    return out || null;
  }

  private buildDireccion(parts: Array<string | null>): string | null {
    const filtered = parts.map((p) => this.cleanText(p)).filter((p) => p && p !== '-') as string[];
    return filtered.length ? filtered.join(', ') : null;
  }

  private isV2(workbook: XLSX.WorkBook): boolean {
    const h1 = workbook.Sheets['Hoja1'];
    const h2 = workbook.Sheets['Hoja2'];
    const title = this.cleanText(h2?.['B3']?.v) || '';
    return !!h1 && !!h2 && title.includes('DICTAMEN QUE DETERMINA');
  }

  convertirAJSON(workbook: XLSX.WorkBook): any {
    return this.isV2(workbook) ? this.extractDictamenV2FromWorkbook(workbook) : this.extractDictamenV1FromWorkbook(workbook);
  }

  private extractDictamenV2FromWorkbook(workbook: XLSX.WorkBook): any {
    const h1 = workbook.Sheets['Hoja1'];
    const h2 = workbook.Sheets['Hoja2'];
    const gm = (s: XLSX.WorkSheet, r: string) => this.cleanText(this.getMergedValue(s, r));
    const gv = (s: XLSX.WorkSheet, r: string) => this.getMergedValue(s, r);

    const direccion_muestreo = {
      calle: gm(h2, 'B19:K19'), numero_exterior: gm(h2, 'L19:U19'), numero_interior: gm(h2, 'B21:E21'), colonia: gm(h2, 'F21:M21'),
      codigo_postal: gm(h2, 'N21:U21'), localidad: gm(h2, 'B23:E23'), municipio_alcaldia: gm(h2, 'F23:M23'), entidad_federativa: gm(h2, 'N23:U23')
    };

    const columnMap = {
      A: { key: 'componente', titulo_excel: gm(h1, 'A4:A4') },
      B: { key: 'factor_mezcla_presion_vapor_kpa', titulo_excel: gm(h1, 'B4:B4') },
      C: { key: 'densidad_relativa_componente', titulo_excel: gm(h1, 'C4:C4') },
      D: { key: 'mon_componente', titulo_excel: gm(h1, 'D4:D4') },
      E: { key: 'porcentaje_volumen_liquido', titulo_excel: gm(h1, 'E4:E4') },
      F: { key: 'presion_parcial_vapor_kpa', titulo_excel: gm(h1, 'F4:F4') },
      G: { key: 'densidad_relativa_parcial', titulo_excel: gm(h1, 'G4:G4') },
      H: { key: 'mon_parcial', titulo_excel: gm(h1, 'H4:H4') }
    } as const;

    const filas = Array.from({ length: 16 }, (_, i) => i + 5).map((row) => ({
      componente: this.cleanText(h1?.[`A${row}`]?.v),
      factor_mezcla_presion_vapor_kpa: this.toNumberOrNull(h1?.[`B${row}`]?.v),
      densidad_relativa_componente: this.toNumberOrNull(h1?.[`C${row}`]?.v),
      mon_componente: this.toNumberOrNull(h1?.[`D${row}`]?.v),
      porcentaje_volumen_liquido: this.toNumberOrNull(h1?.[`E${row}`]?.v),
      presion_parcial_vapor_kpa: this.toNumberOrNull(h1?.[`F${row}`]?.v),
      densidad_relativa_parcial: this.toNumberOrNull(h1?.[`G${row}`]?.v),
      mon_parcial: this.toNumberOrNull(h1?.[`H${row}`]?.v)
    }));

    const propano = this.toNumberOrNull(gv(h2, 'U46:U47'));
    const butano = this.toNumberOrNull(gv(h2, 'U48:U49'));

    return {
      version: 'dictamen_v2',
      codigo_procedimiento: 'FR-T55',
      id_informe: gm(h2, 'G2:U2'),
      titulo_documento: gm(h2, 'B3:U3'),
      fecha_emision: this.excelDateToISO(gv(h2, 'Q5:U5')),
      datos_cliente: {
        nombre_razon_social: gm(h2, 'B12:U12'),
        rfc: this.concatRange(h2, 'H9:S9'),
        numero_permiso: gm(h2, 'B14:U14'),
        actividad_o_planta: gm(h2, 'B16:U16'),
        direccion: this.buildDireccion([direccion_muestreo.calle, direccion_muestreo.numero_exterior, direccion_muestreo.numero_interior, direccion_muestreo.colonia, direccion_muestreo.codigo_postal, direccion_muestreo.localidad, direccion_muestreo.municipio_alcaldia, direccion_muestreo.entidad_federativa]),
        direccion_muestreo,
        medio_transporte_o_almacenamiento: gm(h2, 'B25:U25'),
        campo_y_yacimiento: gm(h2, 'B27:U27')
      },
      laboratorio_acreditado: {
        nombre_razon_social: gm(h2, 'B34:U34'),
        rfc: this.concatRange(h2, 'H31:S31'),
        direccion: gm(h1, 'A35:H35'),
        email: gm(h1, 'A36:H36')?.replace(/^e-?mail:\s*/i, '') || null
      },
      informacion_prueba: {
        fecha_toma_muestra: this.excelDateToISO(gv(h2, 'B38:G38')),
        fecha_realizacion_pruebas: this.excelDateToISO(gv(h2, 'H38:U38')),
        fecha_resultados: this.excelDateToISO(gv(h2, 'B40:G40')),
        numero_lote: gm(h2, 'H40:U40'),
        volumen_muestra_analizada: gm(h2, 'B42:G42')
      },
      metodos_y_resultados: {
        metodo_muestreo: { descripcion: gm(h2, 'B45:E45'), norma: gm(h2, 'F45:I45') },
        metodo_cromatografia: { descripcion: gm(h2, 'B46:E49'), norma: gm(h2, 'F46:I49') },
        resultados: [
          { componente: 'Propano en la mezcla', valor: propano, valor_redondeado_visible: propano === null ? null : Number(propano.toFixed(1)), unidad: '%vol' },
          { componente: 'Butano en la mezcla', valor: butano, valor_redondeado_visible: butano === null ? null : Number(butano.toFixed(1)), unidad: '%vol' }
        ]
      },
      personal_proveedor_emite_dictamen: {
        nombre: gm(h2, 'B56:G56'), rfc: this.concatRange(h2, 'H56:T56'), declaracion: gm(h2, 'B57:U57'), firma_texto: gm(h2, 'E62:N62')
      },
      representante_legal: {
        nombre: gm(h2, 'B67:G67'), rfc: this.concatRange(h2, 'H67:T67'), declaracion: gm(h2, 'B68:U68'), firma_texto: gm(h2, 'E73:N73')
      },
      firmas: {
        personal_proveedor_emite_dictamen: { nombre: gm(h2, 'B56:G56'), rfc: this.concatRange(h2, 'H56:T56') },
        representante_legal: { nombre: gm(h2, 'B67:G67'), rfc: this.concatRange(h2, 'H67:T67') }
      },
      analisis_tecnico_gas_lp: {
        titulo: gm(h1, 'A1:H1'),
        tipo_producto: 'Gas Licuado de Petróleo (Gas LP)',
        metodo: gm(h1, 'A3:H3'),
        tabla_componentes: {
          "compontentes": filas,
          totales: {
            etiqueta: gm(h1, 'D21:D21'),
            porcentaje_volumen_liquido: this.toNumberOrNull(h1?.['E21']?.v),
            presion_parcial_vapor_kpa: this.toNumberOrNull(h1?.['F21']?.v),
            densidad_relativa_parcial: this.toNumberOrNull(h1?.['G21']?.v),
            mon_parcial: this.toNumberOrNull(h1?.['H21']?.v)
          }
        },
        resultados_resumen: {
          densidad: { etiqueta: gm(h1, 'D23:D23'), valor: this.toNumberOrNull(h1?.['E23']?.v), unidad: gm(h1, 'F23:F23') },
          presion_vapor: { etiqueta: gm(h1, 'D24:D24'), valor: this.toNumberOrNull(h1?.['E24']?.v), unidad: gm(h1, 'F24:F24') },
          mon: { etiqueta: gm(h1, 'D25:D25'), valor: this.toNumberOrNull(h1?.['E25']?.v), unidad: gm(h1, 'F25:F25') },
          propano: { etiqueta: gm(h1, 'D26:D26'), valor: this.toNumberOrNull(h1?.['E26']?.v), unidad: gm(h1, 'F26:F26') },
          butano: { etiqueta: gm(h1, 'D27:D27'), valor: this.toNumberOrNull(h1?.['E27']?.v), unidad: gm(h1, 'F27:F27') },
          otros_componentes: { etiqueta: gm(h1, 'D28:D28'), valor: this.toNumberOrNull(h1?.['E28']?.v), unidad: gm(h1, 'F28:F28') },
          propano_butano: { etiqueta: gm(h1, 'D29:D29'), valor: this.toNumberOrNull(h1?.['E29']?.v), unidad: gm(h1, 'F29:F29') },
          propano_normalizado: { etiqueta: gm(h1, 'D30:D30'), valor: this.toNumberOrNull(h1?.['E30']?.v), unidad: gm(h1, 'F30:F30') },
          butano_normalizado: { etiqueta: gm(h1, 'D31:D31'), valor: this.toNumberOrNull(h1?.['E31']?.v), unidad: gm(h1, 'F31:F31') }
        }
      }
    };
  }

  private extractDictamenV1FromWorkbook(workbook: XLSX.WorkBook): any {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const buscarTexto = (clave: string) => {
      const fila = rows.find(r => r.some(c => typeof c === 'string' && c.includes(clave)));
      if (!fila) return null; const idx = fila.findIndex(c => typeof c === 'string' && c.includes(clave)); return fila[idx + 1] ?? fila[idx + 2] ?? null;
    };
    return {
      id_informe: buscarTexto('ID DEL INFORME'), fecha_emision: null,
      datos_cliente: { nombre_razon_social: buscarTexto('NOMBRE, DENOMINACIÓN'), rfc: buscarTexto('RFC:'), numero_permiso: buscarTexto('PERMISO'), direccion: buscarTexto('DIRECCIÓN'), contacto: buscarTexto('CONTACTO:'), telefono: buscarTexto('TELÉFONO:') },
      laboratorio_acreditado: { nombre_razon_social: null, rfc: null },
      datos_item: { tipo_producto: null, metodo_muestreo: null, titulo_permiso: null, fecha_muestreo: null, fecha_recepcion: null, identificacion_almacenamiento: null, plan_muestreo: null, fecha_resultado: null, volumen_muestra: null, periodicidad: null, domicilio_muestreo: null, domicilio_analisis: null },
      datos_ensayo: [], representante_legal: { nombre: null, rfc: null }, datos_personal_acreditado: { rfc_analiza: null, rfc_muestrea: null, rfc_autoriza: null },
      condiciones_ambientales: { temperatura_c: null, humedad_hr: null, presion_kpa: 0 }, observaciones: [], firmas: { analizado_por: {}, muestreado_por: {}, autorizado_por: {} },
      version: 'Ver.01 Rev. 00', fin_informe: true, codigo_procedimiento: 'FR-T55'
    };
  }

  onJsonEditableChange() {
    try {
      this.jsonPreview = JSON.parse(this.jsonEditable);
    } catch {
      // mantener último JSON válido
    }
  }

  copiarJSON() { if (!this.jsonEditable) return; navigator.clipboard.writeText(this.jsonEditable); this.mostrarToast('Copiado correctamente'); }
  descargarJSON() { if (!this.jsonEditable) return; const blob = new Blob([this.jsonEditable], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${this.nombreArchivoOriginal}.json`; link.click(); }
}
