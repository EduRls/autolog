import { Injectable } from '@angular/core';
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  ImageRun, TextRun, WidthType, HeightRule, PageOrientation,
  VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';
import { LoadingController } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class WordGenertaorService {

  constructor(
    private loadCtrl: LoadingController,
    private sanitizer: DomSanitizer
  ) { }

  async generarWordDocument(codigosGenerados: any[], columnas: number, filas: number, altoHoja: number, largoHoja: number, codigosPorPagina: number) {
    const loadWordGenerador = await this.loadCtrl.create({
      message: "Generando documento Word...",
      mode: "ios"
    });
    await loadWordGenerador.present();

    try {
      const logoResponse = await fetch('/assets/logoQR_rotado.png');
      const logoBuffer = await logoResponse.arrayBuffer();
      const logoUint8 = new Uint8Array(logoBuffer);

      const grupos = [];
      for (let i = 0; i < codigosGenerados.length; i += codigosPorPagina) {
        grupos.push(codigosGenerados.slice(i, i + codigosPorPagina));
      }

      const doc = new Document({
        sections: grupos.map(grupo => this.crearPagina(grupo, logoUint8, columnas, filas, altoHoja, largoHoja))
      });

      const blob = await Packer.toBlob(doc);
      const fechaHora = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
      saveAs(blob, `CODIGOS_QR_${fechaHora}.docx`);

    } catch (error) {
      console.error('Error generando documento Word:', error);
    } finally {
      loadWordGenerador.dismiss();
    }
  }


  private crearPagina(codigos: any[], logoUint8: Uint8Array, columnas: number, filas: number, altoHoja: number, largoHoja: number) {
    const rows: TableRow[] = [];

    // Alto fila predeterminado: divide espacio entre filas, usa uno menor para la última si quieres
    const alturaNormal = ((altoHoja - 0.8) / filas); // Ejemplo: 2.23 cm si hoja es 14.1 y hay 6 filas
    const rowHeights = Array.from({ length: filas }, (_, i) => (i === filas - 1 ? alturaNormal * 0.68 : alturaNormal)).map(h => h * 567);

    for (let fila = 0; fila < filas; fila++) {
      const cells: TableCell[] = [];
      for (let col = 0; col < columnas; col++) {
        const index = fila * columnas + col;
        const leftMargin = col > 0 ? Math.round(0.8 * 567) : 0;

        if (index < codigos.length) {
          const qrData = codigos[index].qrData;
          const base64 = this.getBase64FromSafeResourceUrl(qrData);
          cells.push(this.crearCeldaConImagen(base64, logoUint8, leftMargin, codigos[index].identificador));
        } else {
          cells.push(new TableCell({
            children: [new Paragraph("")],
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: leftMargin, right: 0 }
          }));
        }
      }
      rows.push(new TableRow({
        children: cells,
        height: { value: rowHeights[fila], rule: HeightRule.EXACT }
      }));
    }

    const pageWidth = altoHoja * 567;
    const pageHeight = largoHoja * 567;
    const marginTop = 0.8 * 567;
    const marginLeft = 0.6 * 567;
    const marginRight = 0.3 * 567;

    const anchoDisponibleTabla = pageHeight - (marginLeft + marginRight);
    const anchoColumna = anchoDisponibleTabla / columnas;

    return {
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: pageWidth,
            height: pageHeight
          },
          margin: {
            top: marginTop,
            bottom: 0,
            left: marginLeft,
            right: marginRight
          }
        }
      },
      children: [
        new Table({
          width: {
            size: anchoDisponibleTabla,
            type: WidthType.DXA
          },
          columnWidths: Array(columnas).fill(anchoColumna),
          rows: rows,
          borders: {
            top: { style: 'none' },
            bottom: { style: 'none' },
            left: { style: 'none' },
            right: { style: 'none' },
            insideHorizontal: { style: 'none' },
            insideVertical: { style: 'none' }
          }
        })
      ]
    };
  }




  private crearCeldaConImagen(
    base64Data: string,
    logoUint8: Uint8Array,
    leftMargin: number = 0,
    identificador?: string
  ): TableCell {
    const qrUint8 = this.base64ToUint8Array(base64Data);

    return new TableCell({
      children: [
        new Paragraph({
          spacing: {
            before: 0,   // Eliminar espacio antes del párrafo
            after: 0     // Eliminar espacio después del párrafo
          },
          children: [
            new ImageRun({
              data: logoUint8,
              type: 'png',
              transformation: {
                width: 50,
                height: 50
              }
            }),
            new TextRun({ text: "  ", size: 24 }),
            new ImageRun({
              data: qrUint8,
              type: 'png',
              transformation: {
                width: 51,
                height: 51
              }
            }),
            new TextRun({ break: 1 }), // Salto de línea
            new TextRun({
              text: identificador || '',
              bold: true,
              size: 8,
              font: 'Courier New'
            })
          ],
        })
      ],
      verticalAlign: VerticalAlign.TOP,  // Alinear al borde superior
      margins: {
        top: 0,
        bottom: 0,
        left: leftMargin,  // Margen izquierdo personalizado
        right: 0
      }
    });
  }

  /*
  private crearCeldaConImagen(
    base64Data: string,
    logoUint8: Uint8Array,
    leftMargin: number = 0,
    identificador?: string
  ): TableCell {
    const qrUint8 = this.base64ToUint8Array(base64Data);
  
    // Convertir el identificador a texto vertical tipo etiqueta
    const folioVertical = (identificador || '').split('').join('\n');
  
    return new TableCell({
      children: [
        new Paragraph({
          alignment: 'center',
          children: [
            // LOGO ROTADO a la izquierda
            new ImageRun({
              data: logoUint8,
              type: 'png',
              transformation: { width: 40, height: 55 }
            }),
            new TextRun({ text: "   " }),
            // QR al centro
            new ImageRun({
              data: qrUint8,
              type: 'png',
              transformation: { width: 60, height: 55 }
            }),
            new TextRun({ text: "\n" }),
           
          ]
        })
      ],
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        top: 100,
        bottom: 100,
        left: leftMargin,
        right: 0
      }
    });
  }
  
  
  */

  private getBase64FromSafeResourceUrl(safeUrl: SafeResourceUrl): string {
    const url = this.sanitizer.sanitize(4, safeUrl) || '';
    const base64Match = url.match(/base64,(.*)$/);
    return base64Match?.[1] || (typeof safeUrl === 'string' ? safeUrl.split(',')[1] : '');
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }
}