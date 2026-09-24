import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SidebarLayoutService } from './sidebar-layout.service';

describe('SidebarLayoutService', () => {
  let events: Subject<NavigationEnd>;
  let router: Router & { url: string; events: Subject<NavigationEnd> };
  let service: SidebarLayoutService;
  let originalClasses: string;

  beforeEach(() => {
    originalClasses = document.documentElement.className;
    localStorage.removeItem('autolog-sidebar-collapsed');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    events = new Subject<NavigationEnd>();
    router = { url: '/home', events } as unknown as typeof router;
    service = new SidebarLayoutService(router, document);
    service.activateShell();
  });

  afterEach(() => {
    service.ngOnDestroy();
    events.complete();
    document.documentElement.className = originalClasses;
    localStorage.removeItem('autolog-sidebar-collapsed');
  });

  it('mantiene una sola fuente para ancho expandido y compacto', () => {
    expect(document.documentElement.classList.contains('autolog-sidebar-collapsed')).toBeFalse();
    service.toggle();
    expect(service.snapshot.collapsed).toBeTrue();
    expect(document.documentElement.classList.contains('autolog-sidebar-collapsed')).toBeTrue();
    service.toggle();
    expect(document.documentElement.classList.contains('autolog-sidebar-collapsed')).toBeFalse();
  });

  it('conserva la decisión manual en 768–1199 hasta cruzar un breakpoint', () => {
    service.handleResize(1024);
    expect(service.snapshot.collapsed).toBeTrue();
    service.toggle();
    expect(service.snapshot.collapsed).toBeFalse();
    service.handleResize(1000);
    expect(service.snapshot.collapsed).toBeFalse();
  });

  it('no elimina el shell al cambiar sucesivamente entre rutas privadas', () => {
    for (const url of ['/distribuidores', '/asistencia/configuracion', '/autos', '/panel-control']) {
      router.url = url;
      events.next(new NavigationEnd(1, url, url));
      expect(document.documentElement.classList.contains('autolog-shell')).toBeTrue();
    }
  });

  it('usa drawer superpuesto solo en móvil y lo cierra con Escape', () => {
    service.handleResize(390);
    service.toggle();
    expect(document.documentElement.classList.contains('autolog-drawer-open')).toBeTrue();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.documentElement.classList.contains('autolog-drawer-open')).toBeFalse();
  });

  it('limpia las clases globales al navegar a una ruta pública', () => {
    router.url = '/login';
    events.next(new NavigationEnd(1, '/login', '/login'));
    expect(document.documentElement.classList.contains('autolog-shell')).toBeFalse();
  });
});
