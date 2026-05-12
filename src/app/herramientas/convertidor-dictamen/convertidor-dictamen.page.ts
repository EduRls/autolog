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
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx'].includes(fileExtension || '')) {
      this.mostrarToast('El archivo debe ser .xls o .xlsx', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        this.jsonPreview = this.convertirAJSON(workbook);
        this.mostrarToast('Archivo cargado correctamente');
      } catch (err) {
        console.error(err);
        this.mostrarToast('Error al leer el archivo', 'danger');
      }
    };

    reader.readAsArrayBuffer(file);
  }

  convertirAJSON(workbook: XLSX.WorkBook): any {
    const sheet1 = workbook.Sheets['Hoja1'] || workbook.Sheets[workbook.SheetNames[0]];
    const sheet2 = workbook.Sheets['Hoja2'] || workbook.Sheets[workbook.SheetNames[1]] || sheet1;

    const val = (sheet: XLSX.WorkSheet, cell: string) => sheet?.[cell]?.v ?? null;
    const str = (sheet: XLSX.WorkSheet, cell: string) => {
      const v = val(sheet, cell);
      return v === null || v === undefined ? null : String(v).trim();
    };
    const num = (sheet: XLSX.WorkSheet, cell: string) => {
      const v = val(sheet, cell);
      if (v === null || v === undefined || v === '') return null;
      const parsed = Number(v);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const excelDate = (sheet: XLSX.WorkSheet, cell: string) => {
      const n = num(sheet, cell);
      return typeof n === 'number' ? XLSX.SSF.format('yyyy-mm-dd', n) : null;
    };

    return {
      archivo: `${this.nombreArchivoOriginal}.xlsx`,
      hojas: {
        Hoja1: {
          descripcion: 'Cálculo técnico del análisis de Gas LP conforme a ASTM D2163-23e1.',
          grupos: {
            encabezado: [
              {
                campo: 'titulo_analisis',
                celda: 'A1:H1',
                valor: str(sheet1, 'A1')
              },
              {
                campo: 'metodo',
                celda: 'A3:H3',
                valor: str(sheet1, 'A3')
              }
            ],
            resultados_resumen: [
              { campo: 'densidad', etiqueta: str(sheet1, 'D23'), valor: num(sheet1, 'E23'), unidad: str(sheet1, 'F23') },
              { campo: 'presion_vapor', etiqueta: str(sheet1, 'D24'), valor: num(sheet1, 'E24'), unidad: str(sheet1, 'F24') },
              { campo: 'mon', etiqueta: str(sheet1, 'D25'), valor: num(sheet1, 'E25'), unidad: str(sheet1, 'F25') },
              { campo: 'propano', etiqueta: str(sheet1, 'D26'), valor: num(sheet1, 'E26'), unidad: str(sheet1, 'F26') },
              { campo: 'butano', etiqueta: str(sheet1, 'D27'), valor: num(sheet1, 'E27'), unidad: str(sheet1, 'F27') },
              { campo: 'otros_componentes', etiqueta: str(sheet1, 'D28'), valor: num(sheet1, 'E28'), unidad: str(sheet1, 'F28') },
              { campo: 'propano_butano', etiqueta: str(sheet1, 'D29'), valor: num(sheet1, 'E29'), unidad: str(sheet1, 'F29') },
              { campo: 'propano_normalizado', etiqueta: str(sheet1, 'D30'), valor: num(sheet1, 'E30'), unidad: str(sheet1, 'F30') },
              { campo: 'butano_normalizado', etiqueta: str(sheet1, 'D31'), valor: num(sheet1, 'E31'), unidad: str(sheet1, 'F31') }
            ],
          }
        },
        Hoja2: {
          descripcion: 'Formato formal del dictamen.',
          grupos: {
            encabezado: {
              folio_dictamen: str(sheet2, 'G2'),
              titulo_documento: str(sheet2, 'B3'),
              fecha_emision_dictamen: excelDate(sheet2, 'Q5')
            },
            datos_sujeto_obligado: {
              rfc_sujeto_obligado: str(sheet2, 'H9'),
              denominacion_social: str(sheet2, 'B12'),
              numero_permiso: str(sheet2, 'B14'),
              nombre_planta_o_actividad: str(sheet2, 'B16'),
              domicilio_muestra: {
                calle: str(sheet2, 'B19'),
                numero_exterior: str(sheet2, 'L19'),
                numero_interior: str(sheet2, 'B21'),
                colonia: str(sheet2, 'F21'),
                codigo_postal: str(sheet2, 'N21'),
                localidad: str(sheet2, 'B23'),
                municipio_alcaldia: str(sheet2, 'F23'),
                entidad_federativa: str(sheet2, 'N23')
              },
              medio_transporte_o_almacenamiento: str(sheet2, 'B25'),
              campo_y_yacimiento: str(sheet2, 'B27')
            },
            datos_laboratorio: {
              rfc_laboratorio: str(sheet2, 'H31'),
              razon_social_laboratorio: str(sheet2, 'B34')
            },
            informacion_prueba: {
              fecha_toma_muestra: excelDate(sheet2, 'B38'),
              fecha_realizacion_pruebas: excelDate(sheet2, 'H38'),
              fecha_resultados: excelDate(sheet2, 'B40'),
              numero_lote: str(sheet2, 'H40'),
              volumen_muestra_analizada: str(sheet2, 'B42')
            },
            metodos_y_resultados: {
              metodo_muestreo: {
                descripcion: str(sheet2, 'B45'),
                norma: str(sheet2, 'F45')
              },
              metodo_cromatografia: {
                descripcion: str(sheet2, 'B46'),
                norma: str(sheet2, 'F46')
              },
              porcentaje_propano_mezcla: num(sheet2, 'U46'),
              porcentaje_butano_mezcla: num(sheet2, 'U48')
            },
            firmas_responsables: {
              nombre_personal_autorizado: str(sheet2, 'B56'),
              nombre_representante_legal: str(sheet2, 'B67')
            },
            cierre: {
              fin_documento: str(sheet2, 'B76')
            }
          }
        }
      }
    };
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
