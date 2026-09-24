import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;
  let component: MenuComponent;
  let routerEvents: Subject<NavigationEnd>;
  let router: jasmine.SpyObj<Router> & { url: string; events: Subject<NavigationEnd> };
  let auth: jasmine.SpyObj<AuthService>;
  let storage: jasmine.SpyObj<StorageService>;
  let rootClass: string;

  async function createMenu(role: 'admin' | 'capturista' = 'admin', url = '/home', width = 1366) {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    routerEvents = new Subject<NavigationEnd>();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) as typeof router;
    router.url = url;
    router.events = routerEvents;
    router.navigateByUrl.and.resolveTo(true);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    storage = jasmine.createSpyObj<StorageService>('StorageService', ['get', 'clear']);
    storage.get.and.resolveTo({ rol: role, usuario: 'Usuario de prueba' });

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: StorageService, useValue: storage },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    rootClass = document.documentElement.className;
    localStorage.removeItem('autolog-sidebar-collapsed');
    localStorage.removeItem('autolog-navigation-open-groups');
  });

  afterEach(() => {
    fixture?.destroy();
    routerEvents?.complete();
    document.documentElement.className = rootClass;
    localStorage.removeItem('autolog-sidebar-collapsed');
    localStorage.removeItem('autolog-navigation-open-groups');
  });

  it('renderiza los grupos definidos y conserva perfil y cierre de sesión', async () => {
    await createMenu();
    const text = fixture.nativeElement.textContent;
    ['General', 'Ventas', 'Flotilla', 'Expendio', 'Asistencia', 'Administración'].forEach(label => expect(text).toContain(label));
    expect(fixture.nativeElement.querySelector('button[title="Mi perfil"]')).not.toBeNull();
    expect(text).toContain('Cerrar sesión');
    expect(text).not.toMatch(/\bEmpleados\b/);
  });

  it('expande y contrae un grupo sin mezclarlo con el plegado del sidebar', async () => {
    await createMenu('admin', '/home');
    const sales = component.visibleGroups.find(group => group.id === 'sales')!;
    expect(component.isGroupOpen(sales)).toBeFalse();
    component.toggleGroup(sales);
    expect(component.isGroupOpen(sales)).toBeTrue();
    expect(component.isCollapsed).toBeFalse();
    component.toggleGroup(sales);
    expect(component.isGroupOpen(sales)).toBeFalse();
  });

  it('abre automáticamente el grupo de la ruta activa y conserva el activo al navegar', async () => {
    await createMenu('admin', '/asistencia/registros');
    const attendance = component.visibleGroups.find(group => group.id === 'attendance')!;
    expect(component.isGroupOpen(attendance)).toBeTrue();
    expect(component.isActive('/asistencia/registros')).toBeTrue();
    router.url = '/usuarios';
    routerEvents.next(new NavigationEnd(1, '/usuarios', '/usuarios'));
    expect(component.openGroups.has('administration')).toBeTrue();
    expect(component.isActive('/usuarios')).toBeTrue();
  });

  it('encuentra opciones por etiqueta y por palabras clave', async () => {
    await createMenu();
    component.searchQuery = 'distri';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).toEqual(['Distribuidores']);
    component.searchQuery = 'mantenimiento';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).toContain('Panel de servicios');
  });

  it('ignora mayúsculas y minúsculas en la búsqueda', async () => {
    await createMenu();
    component.searchQuery = 'USUARIO';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).toEqual(['Usuarios']);
  });

  it('ignora acentos en la búsqueda', async () => {
    await createMenu();
    component.searchQuery = 'CONFIGURACION';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).toContain('Configuración');
  });

  it('no revela opciones restringidas a un capturista, incluso al buscarlas', async () => {
    await createMenu('capturista');
    component.searchQuery = 'configuracion';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).not.toContain('Configuración');
    component.searchQuery = 'usuario';
    expect(component.visibleGroups.flatMap(group => group.items).map(item => item.label)).not.toContain('Usuarios');
    expect(component.visibleGroups.some(group => group.id === 'administration')).toBeFalse();
  });

  it('el botón de un grupo expande primero el sidebar compacto', async () => {
    await createMenu('admin', '/home', 1024);
    expect(component.isCollapsed).toBeTrue();
    const fleet = component.visibleGroups.find(group => group.id === 'fleet')!;
    component.toggleGroup(fleet);
    expect(component.isCollapsed).toBeFalse();
    expect(component.isGroupOpen(fleet)).toBeTrue();
  });

  it('mantiene el drawer móvil y permite cerrarlo con Escape', async () => {
    await createMenu('admin', '/home', 390);
    component.toggleSidebar();
    expect(component.isMobileOpen).toBeTrue();
    expect(document.documentElement.classList.contains('autolog-drawer-open')).toBeTrue();
    component.onEscape();
    expect(component.isMobileOpen).toBeFalse();
    expect(document.documentElement.classList.contains('autolog-drawer-open')).toBeFalse();
  });

  it('mantiene la navegación a perfil y el cierre de sesión', async () => {
    await createMenu();
    await component.rToMiPerfil();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/mi-perfil', { replaceUrl: true });
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(storage.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('distingue Resumen de Panel de servicios y marca cada ruta de asistencia', async () => {
    await createMenu('admin', '/home');
    expect(component.isActive('/home')).toBeTrue();
    expect(component.isActive('/home#servicios')).toBeFalse();
    for (const route of ['/asistencia', '/asistencia/registros', '/asistencia/configuracion']) {
      router.url = route;
      expect(component.isActive(route)).toBeTrue();
    }
  });

  it('una instancia cacheada no elimina las clases del shell al destruirse', async () => {
    await createMenu('admin', '/home');
    expect(document.documentElement.classList.contains('autolog-shell')).toBeTrue();
    fixture.destroy();
    expect(document.documentElement.classList.contains('autolog-shell')).toBeTrue();
  });
});
