import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Filesystem, Directory, Encoding, PermissionStatus } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor() {}

  /**
   * Exporta datos a un archivo Excel.
   * @param data Array de objetos o datos a exportar.
   * @param fileName Nombre del archivo Excel.
   */
  async exportToExcel(data: any[], fileName: string): Promise<void> {
    // Verificar permisos antes de proceder
    const hasPermissions = await this.checkPermissions();
    if (!hasPermissions) {
      console.error('No se pudieron conceder los permisos necesarios para exportar el archivo.');
      return;
    }

    // Crear una hoja de trabajo (worksheet) a partir de los datos
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Crear un libro de trabajo (workbook) y agregar la hoja
    const workbook: XLSX.WorkBook = {
      Sheets: { Datos: worksheet },
      SheetNames: ['Datos'],
    };

    // Generar el archivo Excel en formato binario
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Guardar el archivo usando FileSaver
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  /**
   * Verifica y solicita permisos necesarios para operaciones de exportación.
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      const status: PermissionStatus = await Filesystem.checkPermissions();
      if (status.publicStorage === 'granted') {
        return true;
      }

      const requestStatus: PermissionStatus = await Filesystem.requestPermissions();
      return requestStatus.publicStorage === 'granted';
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  /**
   * Guarda el archivo Excel usando FileSaver.
   * @param buffer Datos binarios del archivo.
   * @param fileName Nombre del archivo.
   */
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    if (Capacitor.getPlatform() === 'web') {
      FileSaver.saveAs(data, `${fileName}.xlsx`);
    } else {
      this.saveFileToFilesystem(data, fileName);
    }
  }

  /**
   * Guarda el archivo en el sistema de archivos en dispositivos móviles.
   * @param data Datos binarios del archivo.
   * @param fileName Nombre del archivo.
   */
  private async saveFileToFilesystem(data: Blob, fileName: string): Promise<void> {
    try {
      const arrayBuffer = await data.arrayBuffer();
      const base64Data = this.arrayBufferToBase64(arrayBuffer);

      await Filesystem.writeFile({
        path: `${fileName}.xlsx`,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      console.log('Archivo guardado exitosamente en el sistema de archivos.');
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
    }
  }

  /**
   * Convierte un ArrayBuffer a base64.
   * @param buffer ArrayBuffer de los datos.
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}