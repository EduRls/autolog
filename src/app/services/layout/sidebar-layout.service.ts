import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription, filter } from 'rxjs';

export interface SidebarLayoutState {
  collapsed: boolean;
  mobileOpen: boolean;
  viewportWidth: number;
}

@Injectable({ providedIn: 'root' })
export class SidebarLayoutService implements OnDestroy {
  private readonly storageKey = 'autolog-sidebar-collapsed';
  private readonly publicRoutes = ['/login', '/reloj', '/politicas', '/politicas-pda'];
  private readonly stateSubject: BehaviorSubject<SidebarLayoutState>;
  private readonly routerSubscription: Subscription;
  private shellActive = false;
  private readonly resizeListener = () => this.handleResize(window.innerWidth);
  private readonly escapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.closeMobile();
  };

  readonly state$;

  constructor(
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    const viewportWidth = window.innerWidth;
    const persisted = localStorage.getItem(this.storageKey) === 'true';
    this.stateSubject = new BehaviorSubject<SidebarLayoutState>({
      collapsed: viewportWidth < 1200 ? true : persisted,
      mobileOpen: false,
      viewportWidth,
    });
    this.state$ = this.stateSubject.asObservable();
    window.addEventListener('resize', this.resizeListener);
    this.document.addEventListener('keydown', this.escapeListener);
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.syncRoute(this.router.url));
  }

  get snapshot(): SidebarLayoutState { return this.stateSubject.value; }

  activateShell(): void {
    this.shellActive = true;
    this.applyRootClasses();
  }

  deactivateShell(): void {
    this.shellActive = false;
    this.stateSubject.next({ ...this.snapshot, mobileOpen: false });
    this.applyRootClasses();
  }

  toggle(): void {
    const current = this.snapshot;
    if (current.viewportWidth < 768) {
      this.update({ mobileOpen: !current.mobileOpen });
      return;
    }
    const collapsed = !current.collapsed;
    localStorage.setItem(this.storageKey, String(collapsed));
    this.update({ collapsed });
  }

  expand(): void {
    if (this.snapshot.viewportWidth < 768 || !this.snapshot.collapsed) return;
    localStorage.setItem(this.storageKey, 'false');
    this.update({ collapsed: false });
  }

  closeMobile(): void {
    if (!this.snapshot.mobileOpen) return;
    this.update({ mobileOpen: false });
  }

  handleResize(viewportWidth: number): void {
    const current = this.snapshot;
    const enteredCompactRange = current.viewportWidth >= 1200 && viewportWidth < 1200 && viewportWidth >= 768;
    const returnedToDesktop = current.viewportWidth < 1200 && viewportWidth >= 1200;
    const collapsed = enteredCompactRange
      ? true
      : returnedToDesktop
        ? localStorage.getItem(this.storageKey) === 'true'
        : current.collapsed;
    this.update({ viewportWidth, collapsed, mobileOpen: viewportWidth < 768 ? false : current.mobileOpen });
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
    window.removeEventListener('resize', this.resizeListener);
    this.document.removeEventListener('keydown', this.escapeListener);
  }

  private syncRoute(url: string): void {
    const path = url.split(/[?#]/, 1)[0];
    if (this.publicRoutes.some(route => path === route || path.startsWith(route + '/'))) this.deactivateShell();
    else if (path !== '/') this.activateShell();
    this.closeMobile();
  }

  private update(changes: Partial<SidebarLayoutState>): void {
    this.stateSubject.next({ ...this.snapshot, ...changes });
    this.applyRootClasses();
  }

  private applyRootClasses(): void {
    const root = this.document.documentElement;
    const state = this.snapshot;
    root.classList.toggle('autolog-shell', this.shellActive);
    root.classList.toggle('autolog-sidebar-collapsed', this.shellActive && state.collapsed && state.viewportWidth >= 768);
    root.classList.toggle('autolog-drawer-open', this.shellActive && state.mobileOpen && state.viewportWidth < 768);
  }
}
