import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HoraService {

  private readonly API_URL = 'https://worldtimeapi.org/api/timezone/America/Mexico_City';


  constructor(private http: HttpClient) { }

  async obtenerFechaActual(): Promise<string | null> {
    try {
      const response: any = await this.http.get(this.API_URL).toPromise();
      const fechaCompleta = response?.datetime; 
      return fechaCompleta?.split('T')[0] || null;
    } catch (error) {
      console.error('Error al obtener la fecha del servidor:', error);
      return null;
    }
  }

   // 🔹 Fecha y hora completa como Date
  async obtenerFechaYHora(): Promise<Date | null> {
    try {
      const res: any = await this.http.get(this.API_URL).toPromise();
      const fechaHora = res?.datetime;
      return fechaHora ? new Date(fechaHora) : null;
    } catch (error) {
      console.error('Error al obtener la hora del servidor:', error);
      return null;
    }
  }
}
