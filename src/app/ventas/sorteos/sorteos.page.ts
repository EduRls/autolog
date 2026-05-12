import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { SorteoService } from 'src/app/services/admVentas/sorteo/sorteo.service';

@Component({
  selector: 'app-sorteos',
  templateUrl: './sorteos.page.html',
  styleUrls: ['./sorteos.page.scss'],
})
export class SorteosPage implements OnInit {

  docSorteos: any[] = [];

  constructor(
    private sorteo: SorteoService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.getInformacion();
  }

  async mostrarToast(color: 'warning' | 'danger' | 'success', msg: string, position: 'top' | 'bottom' | 'middle') {
    const toast = await this.toastCtrl.create({
      message: msg,
      color: color,
      duration: 1500,
      position: position
    });

    toast.present();
  }

  cambiarMes(event: any) {
    const iso = event.detail.value; // Ejemplo: "2025-07"
    const [year, month] = iso.split('-');
    console.log(`Mes seleccionado: ${month}/${year}`);
  }



  async getInformacion() {
    this.sorteo.getDocsSorteos().subscribe({
      next: (val) => {
        if (val.length == 0) {
          this.mostrarToast('warning', 'No se encontrarón registros', 'bottom')
          return
        }
        this.docSorteos = val;
      }, error: (err) => {
        console.error('Ha ocurrido un problema: ', err)
        this.mostrarToast('danger', 'Ocurrio un error al consultar la infromación, vuelva a intentar', 'bottom')
      }
    })
  }

  filtrarVenta() {

  }

  actualizarDatos() {

  }


  rToGanaPremiosButano(){
    window.open('https://gasbutano-ganapremios.web.app/', '_blank');
  }

}
