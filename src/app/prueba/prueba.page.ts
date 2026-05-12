import { Component, OnInit } from '@angular/core';
import { MonitoreogasmakeService } from '../services/monitoreogasmake.service';



export interface Venta {
  D_CILINDRO?: string;
  ID_VENDEDOR: string;
  FECHA_VENTA: Date;
  DOMICILIO: string;
}

@Component({
  selector: 'app-prueba',
  templateUrl: './prueba.page.html',
  styleUrls: ['./prueba.page.scss'],
})
export class PruebaPage implements OnInit {

  public datos:any = []

  constructor(
    private monitoreogasmakeService: MonitoreogasmakeService
  ) { }

  ngOnInit() {
    this.getInfo()
  }

  getInfo() {
    
  }

    /**
 * Parsea una cadena de ventas separadas por "TWILO" y devuelve un arreglo de objetos Venta.
 * @param data - Cadena de texto con los datos de ventas.
 * @returns Arreglo de objetos Venta.
 */
 parseVentas(data: string): Venta[] {
  // Separar los registros por el delimitador "TWILO"
  const registros = data.split('TWILO').map(reg => reg.trim()).filter(reg => reg !== '');

  // Mapear cada registro a un objeto Venta
  const ventas: Venta[] = registros.map(registro => {
    const campos = registro.split(';');
    const venta: any = {};

    campos.forEach(campo => {
      const [clave, ...valores] = campo.split(':');
      if (clave && valores.length > 0) {
        const valor = valores.join(':').trim(); // En caso de que el valor contenga ':'
        const claveLimpia = clave.trim();

        // Asignar el valor al objeto venta
        venta[claveLimpia] = valor;
      }
    });

    return venta as Venta;
  });

  return ventas;
}

}
