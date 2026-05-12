import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import * as PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  doc,
  collection,
  setDoc,
  addDoc,
  Firestore
} from '@angular/fire/firestore';
import html2canvas from 'html2canvas';
import { WordGenertaorService } from 'src/app/services/word/word-genertaor.service';


interface CodigoQR {
  fechaCreacion: string;
  consecutivo: number;
  idUnico: string;
  codigoGBZ: string;
  codigoEnvio: string;
  capacidadTanque: number;
  identificador: string;
  qrData: SafeUrl; // Para la imagen del QR en base64
}

@Component({
  selector: 'app-generar-codigos',
  templateUrl: './generar-codigos.page.html',
  styleUrls: ['./generar-codigos.page.scss'],
})
export class GenerarCodigosPage implements OnInit {

  qrForm: FormGroup;
  codigosGenerados: CodigoQR[] = [];
  registrosPaginados: CodigoQR[] = [];
  paginaActual = 1;
  registrosPorPagina = 10;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private loadCtrl: LoadingController,
    private firestore: Firestore,
    private wordGenerator: WordGenertaorService
  ) { }

  ngOnInit() {
    this.qrForm = this.fb.group({
      cantidad: [null, [Validators.required, Validators.min(1)]],
      codigoEnvio: ['', [Validators.required, Validators.pattern(/^[0-9]{3}$/)]],
      prefijo: ['GBZ'],
      capacidadTanque: [30, [Validators.required, Validators.min(1)]],
      columnas: [4, Validators.required],
      filas: [6, Validators.required],
      alto_hoja: [14.1, Validators.required],
      largo_hoja: [21.5, Validators.required]
    });
  }

  async generarCodigos() {
    const loadQRGenerador = await this.loadCtrl.create({
      "message": "Generando codigos...",
      "mode": "ios"
    })

    if (this.qrForm.invalid) {
      return;
    }

    loadQRGenerador.present();
    await new Promise(resolve => setTimeout(resolve, 100));

    const { cantidad, codigoEnvio, prefijo, capacidadTanque } = this.qrForm.value;
    this.codigosGenerados = [];

    let codigoGBZ = ''

    for (let i = 1; i <= cantidad; i++) {
      const fechaCreacion = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const idUnico = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      if(codigoGBZ == ''){
        codigoGBZ = this.intercalarGBZ(idUnico, prefijo);
      }
      
      const consecutivo = i.toString().padStart(4, '0');

      const hoy = new Date();
      const anio = hoy.getFullYear().toString(); // "2025"
      const mes = (hoy.getMonth() + 1).toString().padStart(2, '0'); // "06"
      const dia = hoy.getDate().toString().padStart(2, '0'); // "25"
      const folioIdentificador = `${anio[0]}${mes}${i}${dia}${anio[1]}`;


      // Construir el texto del QR
      const textoQR = `TQ-${capacidadTanque}-${consecutivo}-${idUnico}-${codigoGBZ}-${codigoEnvio}`;

      // Generar imagen QR
      const qrData = await this.generarQRCode(textoQR);

      this.codigosGenerados.push({
        fechaCreacion,
        consecutivo: i,
        idUnico,
        codigoGBZ,
        codigoEnvio,
        capacidadTanque,
        identificador: folioIdentificador,
        qrData: this.sanitizer.bypassSecurityTrustUrl(qrData)
      });

    }

    this.paginaActual = 1;
    this.actualizarTabla();
    loadQRGenerador.dismiss()
  }

  intercalarGBZ(id: string, prefijo: string): string {
    // Insertar GBZ en posiciones aleatorias
    const positions = [
      Math.floor(id.length * 0.2),
      Math.floor(id.length * 0.5),
      Math.floor(id.length * 0.8)
    ];

    return [
      id.substring(0, positions[0]),
      prefijo[0] || 'G',
      id.substring(positions[0], positions[1]),
      prefijo[1] || 'B',
      id.substring(positions[1], positions[2]),
      prefijo[2] || 'Z',
      id.substring(positions[2])
    ].join('');
  }

  generarQRCode(texto: string): Promise<string> {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(texto, { errorCorrectionLevel: 'H', width: 300, margin: 2 }, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });
  }

  // Funciones de paginación (iguales a las que ya tienes)
  getTotalPaginas(): number {
    return Math.ceil(this.codigosGenerados.length / this.registrosPorPagina);
  }

  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.codigosGenerados.slice(inicio, fin);
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }


  async generarWordDocument() {
    const columnas = this.qrForm.get('columnas')?.value || 4;
    const filas = this.qrForm.get('filas')?.value || 6;
    const altoHoja = this.qrForm.get('alto_hoja')?.value || 14.1;
    const largoHoja = this.qrForm.get('largo_hoja')?.value || 21.5;
    const codigosPorPagina = columnas * filas;

    await this.wordGenerator.generarWordDocument(
      this.codigosGenerados,
      columnas,
      filas,
      altoHoja,
      largoHoja,
      codigosPorPagina
    );
    await this.guardarCodigos();
  }



  async guardarCodigos() {

    if (this.codigosGenerados.length === 0) return;

    const primerCodigo = this.codigosGenerados[0];
    const fechaDeLaGeneración = primerCodigo.fechaCreacion;
    const codigoEnvio = primerCodigo.codigoEnvio;
    const codigoGBZ = primerCodigo.codigoGBZ;

    try {
      // 1. Crear documento del producto
      const productoRef = doc(collection(this.firestore, 'productos_identificador'));
      await setDoc(productoRef, {
        fechaDeLaGeneración,
        codigoEnvio,
        codigoGBZ
      });

      // 2. Agregar cada código a la subcolección 'codigos'
      const codigosRef = collection(productoRef, 'codigos');
      for (let i = 0; i < this.codigosGenerados.length; i++) {
        const codigo: any = this.codigosGenerados[i];

        // Convertir el qrData (que es un SafeUrl) a string plano
        const qrDataURL = (codigo.qrData as any).changingThisBreaksApplicationSecurity || '';

        await addDoc(codigosRef, {
          fechaCreacion: codigo.fechaCreacion,
          consecutivo: codigo.consecutivo,
          idUnico: codigo.idUnico,
          codigoGBZ: codigo.codigoGBZ,
          codigoEnvio: codigo.codigoEnvio,
          capacidadTanque: codigo.capacidadTanque,
          identificador: codigo.identificador,
          qrData: qrDataURL
        });
      }

      console.log('Códigos guardados exitosamente.');
    } catch (error) {
      console.error('Error al guardar los códigos:', error);
    }
  }


}
