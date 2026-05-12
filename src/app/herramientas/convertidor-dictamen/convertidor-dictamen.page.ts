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
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(private toastCtrl: ToastController) { }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'bottom',
    });
    toast.present();
  }

  abrirSelector() {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.nombreArchivoOriginal = file.name.replace(/\.[^/.]+$/, '');
    const fileExtension = file.name.split('.').pop();
    if (!['xls', 'xlsx'].includes(fileExtension)) {
      this.mostrarToast('El archivo debe ser .xls o .xlsx', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        this.jsonPreview = this.convertirAJSON(rows);
        this.mostrarToast('Archivo cargado correctamente');
      } catch (err) {
        console.error(err);
        this.mostrarToast('Error al leer el archivo', 'danger');
      }
    };

    reader.readAsArrayBuffer(file);
  }

  convertirAJSON(rows: any[][]): any {
    const json: any = {};

    const buscarTexto = (clave: string) => {
      const fila = rows.find(r => r.some(c => typeof c === 'string' && c.includes(clave)));
      if (!fila) return null;
      const idx = fila.findIndex(c => typeof c === 'string' && c.includes(clave));
      return fila[idx + 1] ?? fila[idx + 2] ?? null;
    };

    const buscarFecha = (clave: string) => {
      const valor = buscarTexto(clave);
      return typeof valor === 'number' ? XLSX.SSF.format('yyyy-mm-dd', valor) : null;
    };

    const buscarFilaQueInicia = (texto: string) =>
      rows.findIndex(r => r[0] && typeof r[0] === 'string' && r[0].includes(texto));

    json.id_informe = buscarTexto('ID DEL INFORME');
    json.fecha_emision = buscarFecha('FECHA DE EMISIÓN');

    json.datos_cliente = {
      nombre_razon_social: buscarTexto('NOMBRE, DENOMINACIÓN'),
      rfc: buscarTexto('RFC:'),
      numero_permiso: buscarTexto('PERMISO'),
      direccion: buscarTexto('DIRECCIÓN'),
      contacto: buscarTexto('CONTACTO:'),
      telefono: buscarTexto('TELÉFONO:')
    };

    json.laboratorio_acreditado = {
      nombre_razon_social: (() => {
        const fila = rows.find(r => r.some(c => typeof c === 'string' && c.includes('KALIBRIM')));
        return fila ? fila.find(c => typeof c === 'string' && c.includes('KALIBRIM')) : null;
      })(),
      rfc: (() => {
        const rfcRegex = /[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}/;
        for (let r of rows) {
          for (let c of r) {
            if (typeof c === 'string' && rfcRegex.test(c)) {
              const match = c.match(rfcRegex);
              if (match && match[0].startsWith('MEK')) return match[0];
            }
          }
        }
        return null;
      })()
    };


    json.datos_item = {
      tipo_producto: buscarTexto('CLAVE DE PRODUCTO'),
      metodo_muestreo: buscarTexto('MÉTODO DE MUESTREO'),
      titulo_permiso: buscarTexto('TÍTULO DEL PERMISO'),
      fecha_muestreo: buscarFecha('FECHA DE MUESTREO'),
      fecha_recepcion: buscarFecha('FECHA DE RECEPCIÓN'),
      identificacion_almacenamiento: buscarTexto('IDENTIFICACIÓN DEL ALMACENAMIENTO'),
      plan_muestreo: buscarTexto('PLAN DE MUESTREO'),
      fecha_resultado: buscarFecha('FECHA DE OBTENCIÓN DE RESULTADO'),
      volumen_muestra: (() => {
        const fila = rows.find(r => r.some(c => typeof c === 'string' && c.includes('VOLUMEN DE LA MUESTRA')));
        if (!fila) return null;
        const idx = fila.findIndex(c => typeof c === 'string' && c.includes('VOLUMEN DE LA MUESTRA'));
        for (let i = idx + 1; i < fila.length; i++) {
          if (fila[i] && typeof fila[i] === 'string' && fila[i].trim()) return fila[i].trim();
        }
        return null;
      })(),

      periodicidad: (() => {
        const fila = rows.find(r => r.some(c => typeof c === 'string' && c.includes('PERIODICIDAD')));
        if (!fila) return null;
        const idx = fila.findIndex(c => typeof c === 'string' && c.includes('PERIODICIDAD'));
        for (let i = idx + 1; i < fila.length; i++) {
          if (fila[i] && typeof fila[i] === 'string' && fila[i].trim()) return fila[i].trim();
        }
        return null;
      })(),

      domicilio_muestreo: buscarTexto('DONDE SE TOMO LA MUESTRA'),
      domicilio_analisis: buscarTexto('SE ANALIZA LA MUESTRA')
    };

    // DATOS DE ENSAYO
    const datosEnsayo: any[] = [];
    const idxEnsayo = buscarFilaQueInicia('ENSAYO');
    let ultimaFechaAnalisis: any = null;

    if (idxEnsayo >= 0) {
      for (let i = idxEnsayo + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || (!r[0] && !r[4])) break;

        const componente = r[4];
        if (!componente || ['RESULTADO', 'RESULTADO '].includes(componente.toString().trim().toUpperCase())) continue;

        const ensayo = r[0] || 'CROMATOGRAFÍA';
        const metodo = r[1] || datosEnsayo[datosEnsayo.length - 1]?.metodo_analisis || null;
        const cilindro = r[2] || datosEnsayo[datosEnsayo.length - 1]?.cilindro_muestreo || null;

        const rawFecha = r[7];
        if (typeof rawFecha === 'number') {
          ultimaFechaAnalisis = XLSX.SSF.format('yyyy-mm-dd', rawFecha);
        }

        datosEnsayo.push({
          ensayo,
          metodo_analisis: metodo,
          cilindro_muestreo: cilindro,
          unidad: r[3],
          componente: componente.trim(),
          resultado: r[5] ? Math.round(parseFloat(r[5]) * 100) / 100 : null,
          incertidumbre: r[6] ? Math.round(parseFloat(r[6]) * 100) / 100 : null,
          fecha_analisis: ultimaFechaAnalisis
        });
      }
    }
    json.datos_ensayo = datosEnsayo;



    json.representante_legal = {
      nombre: buscarTexto('REPRESENTANTE LEGAL') ?? json.datos_cliente?.nombre_razon_social,
      rfc: buscarTexto('RFC:')
    };

    json.datos_personal_acreditado = {
      rfc_analiza: buscarTexto('RFC PERSONAL QUE ANALIZA'),
      rfc_muestrea: buscarTexto('RFC PERSONAL QUE MUESTREA'),
      rfc_autoriza: buscarTexto('RFC PERSONAL QUE AUTORIZA')
    };

    json.condiciones_ambientales = {
      temperatura_c: parseFloat(buscarTexto('Temperatura')),
      humedad_hr: parseFloat(buscarTexto('Humedad')),
      presion_kpa: parseFloat(buscarTexto('Presión')) || 0
    };

    const idxObservaciones = buscarFilaQueInicia('*El laboratorio');
    json.observaciones = rows.slice(idxObservaciones)
      .filter(r => r[0] && typeof r[0] === 'string')
      .map(r => r.join(' ').trim());

    const idxFirmas = buscarFilaQueInicia('ANALIZADO POR');
    const nombres = rows[idxFirmas + 1] || [];
    json.firmas = {
      analizado_por: { nombre: nombres[0] },
      muestreado_por: { nombre: nombres[2] },
      autorizado_por: { nombre: nombres[6] }
    };

    json.version = 'Ver.01 Rev. 00';
    json.fin_informe = true;
    json.codigo_procedimiento = 'FR-T55';

    return json;
  }





  copiarJSON() {
    if (!this.jsonPreview) return;
    navigator.clipboard.writeText(JSON.stringify(this.jsonPreview, null, 2));
    this.mostrarToast('Copiado correctamente');
  }

  descargarJSON() {
    if (!this.jsonPreview) return;
    const blob = new Blob([JSON.stringify(this.jsonPreview, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.nombreArchivoOriginal}.json`;
    link.click();
  }
}
