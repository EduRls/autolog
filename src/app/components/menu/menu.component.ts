import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent  implements OnInit {
  @Input() titulo:any;

  public userRole: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.getRole();
    }, 500);
  }

  async getRole(){
    const user = await this.storageService.get('currentUser');
    this.userRole = user.rol;
  }

  rToPanelControl(){
    return this.router.navigateByUrl('/home', {replaceUrl: true});
  }

  rToAutosPage(){
    return this.router.navigateByUrl('/autos', {replaceUrl: true});
  }

  rToPageArticulos(){
    return this.router.navigateByUrl('/articulos', {replaceUrl: true});
  }

  rToAdmUsuarios(){
    return this.router.navigateByUrl('/usuarios', {replaceUrl: true});
  }

  rToMiPerfil(){
    return this.router.navigateByUrl('/mi-perfil', {replaceUrl: true});
  }

  rToPanelVentas(){
    return this.router.navigateByUrl('/panel-control', {replaceUrl: true});
  }

  rToHistorialVentas(){
    return this.router.navigateByUrl('/historial', {replaceUrl: true});
  }

  rToProductos(){
    return this.router.navigateByUrl('/productos', {replaceUrl: true});
  }

  rToDistribu(){
    return this.router.navigateByUrl('/distribuidores', {replaceUrl: true});
  }

  rToIncidentes(){
    return this.router.navigateByUrl('/incidentes', {replaceUrl: true});
  }

  rToGenerarCodigo(){
    return this.router.navigateByUrl('/generar-codigos', {replaceUrl: true});
  }

  rToConvertidor(){
    return this.router.navigateByUrl('/convertidor-dictamen', {replaceUrl: true});
  }

  rToSroteos(){
    return this.router.navigateByUrl('/sorteos', {replaceUrl: true})
  }

  logout(){
    this.authService.logout();
    this.storageService.clear();
    this.router.navigateByUrl('/login', {replaceUrl: true});
  }

}
