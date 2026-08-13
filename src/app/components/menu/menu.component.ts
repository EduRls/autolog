import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, filter } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent implements OnInit, OnDestroy {
  @Input() titulo: any;

  public userRole: any;
  public userName = 'Usuario';
  public isCollapsed = false;
  public isMobileOpen = false;
  public viewportWidth = window.innerWidth;
  private routerSubscription?: Subscription;

  private readonly pageTitles: Record<string, { title: string; description: string }> = {
    pc: { title: 'Panel de servicios', description: 'Consulta el estado actual de la flotilla y administra sus mantenimientos.' },
    auto: { title: 'Unidades', description: 'Administra las unidades, operadores y kilometrajes de la flotilla.' },
    art: { title: 'Artículos', description: 'Gestiona los insumos y costos utilizados en los servicios.' },
    admUser: { title: 'Usuarios', description: 'Administra las cuentas y roles con acceso a Autolog.' },
    panelVen: { title: 'Panel de ventas', description: 'Consulta el desempeño comercial, ubicaciones e incidentes recientes.' },
    historialVentas: { title: 'Historial de ventas', description: 'Analiza ventas e incidentes por periodo, zona y distribuidor.' },
    distribu: { title: 'Distribuidores', description: 'Administra distribuidores, rutas y zonas de operación.' },
    cilindros: { title: 'Productos y cilindros', description: 'Consulta la asignación y estado de los cilindros.' },
    incidentes: { title: 'Incidentes', description: 'Consulta los incidentes registrados en la operación.' },
    codigosQR: { title: 'Generación de códigos QR', description: 'Configura y genera identificadores para cilindros.' },
    convertidorDictamen: { title: 'Convertidor de dictámenes', description: 'Transforma dictámenes en archivos JSON estructurados.' },
    admSorteos: { title: 'Sorteos', description: 'Consulta participantes y resultados mensuales.' },
    panelExpendio: { title: 'Panel de expendio', description: 'Espacio de trabajo para la operación de expendio.' },
    yo: { title: 'Mi perfil', description: 'Consulta la información de tu cuenta.' }
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.isCollapsed = localStorage.getItem('autolog-sidebar-collapsed') === 'true';
    if (this.viewportWidth < 1200) this.isCollapsed = true;
    this.applyShellState();
    this.getRole();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    document.documentElement.classList.remove('autolog-drawer-open');
  }

  get pageTitle() { return this.pageTitles[this.titulo]?.title || 'Autolog'; }
  get pageDescription() { return this.pageTitles[this.titulo]?.description || ''; }
  get isMobile() { return this.viewportWidth < 768; }

  async getRole() {
    const user = await this.storageService.get('currentUser');
    this.userRole = String(user?.rol || '').trim().toLowerCase();
    this.userName = user?.usuario || user?.email || 'Usuario';
  }

  @HostListener('window:resize')
  onResize() {
    const previousWidth = this.viewportWidth;
    this.viewportWidth = window.innerWidth;
    if (this.viewportWidth < 768) this.isMobileOpen = false;
    if (previousWidth < 1200 && this.viewportWidth >= 1200) {
      this.isCollapsed = localStorage.getItem('autolog-sidebar-collapsed') === 'true';
    } else if (this.viewportWidth >= 768 && this.viewportWidth < 1200) {
      this.isCollapsed = true;
    }
    this.applyShellState();
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
      localStorage.setItem('autolog-sidebar-collapsed', String(this.isCollapsed));
    }
    this.applyShellState();
  }

  closeMobileMenu() {
    if (!this.isMobileOpen) return;
    this.isMobileOpen = false;
    this.applyShellState();
  }

  private applyShellState() {
    document.documentElement.classList.add('autolog-shell');
    document.documentElement.classList.toggle('autolog-sidebar-collapsed', this.isCollapsed && !this.isMobile);
    document.documentElement.classList.toggle('autolog-drawer-open', this.isMobileOpen && this.isMobile);
  }

  isActive(path: string) { return this.router.url === path || this.router.url.startsWith(path + '?'); }

  rToPanelControl(){ return this.router.navigateByUrl('/home', {replaceUrl: true}); }
  rToAutosPage(){ return this.router.navigateByUrl('/autos', {replaceUrl: true}); }
  rToPageArticulos(){ return this.router.navigateByUrl('/articulos', {replaceUrl: true}); }
  rToAdmUsuarios(){ return this.router.navigateByUrl('/usuarios', {replaceUrl: true}); }
  rToMiPerfil(){ return this.router.navigateByUrl('/mi-perfil', {replaceUrl: true}); }
  rToPanelVentas(){ return this.router.navigateByUrl('/panel-control', {replaceUrl: true}); }
  rToHistorialVentas(){ return this.router.navigateByUrl('/historial', {replaceUrl: true}); }
  rToProductos(){ return this.router.navigateByUrl('/productos', {replaceUrl: true}); }
  rToDistribu(){ return this.router.navigateByUrl('/distribuidores', {replaceUrl: true}); }
  rToIncidentes(){ return this.router.navigateByUrl('/incidentes', {replaceUrl: true}); }
  rToGenerarCodigo(){ return this.router.navigateByUrl('/generar-codigos', {replaceUrl: true}); }
  rToConvertidor(){ return this.router.navigateByUrl('/convertidor-dictamen', {replaceUrl: true}); }
  rToSroteos(){ return this.router.navigateByUrl('/sorteos', {replaceUrl: true}); }
  rToPanelExpendio(){ return this.router.navigateByUrl('/panel-expendio', {replaceUrl: true}); }

  logout(){
    this.authService.logout();
    this.storageService.clear();
    this.router.navigateByUrl('/login', {replaceUrl: true});
  }
}
