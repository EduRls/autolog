import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, filter } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { SidebarLayoutService } from 'src/app/services/layout/sidebar-layout.service';
import {
  AUTOLOG_NAVIGATION,
  EXTRA_PAGE_TITLES,
  NavigationGroup,
  NavigationItem,
  NavigationSectionId,
  normalizeNavigationSections,
} from './navigation.config';
import { PlantScopeService, PlantScopeState } from 'src/app/services/plants/plant-scope.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent implements OnInit, OnDestroy {
  @Input() titulo = '';
  @ViewChild('navigationSearch') navigationSearch?: ElementRef<HTMLInputElement>;

  readonly navigation = AUTOLOG_NAVIGATION;
  userRole = '';
  userName = 'Usuario';
  isCollapsed = false;
  isMobileOpen = false;
  viewportWidth = window.innerWidth;
  searchQuery = '';
  openGroups = new Set<string>();
  plantState: PlantScopeState = { ready: false, profile: null, plants: [], activePlantId: null };
  menuSections = new Set<NavigationSectionId>();

  private routerSubscription?: Subscription;
  private layoutSubscription?: Subscription;
  private plantSubscription?: Subscription;
  private readonly openGroupsStorageKey = 'autolog-navigation-open-groups';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
    private readonly sidebarLayout: SidebarLayoutService,
    readonly plantScope: PlantScopeService,
  ) {}

  ngOnInit() {
    this.sidebarLayout.activateShell();
    this.layoutSubscription = this.sidebarLayout.state$.subscribe(state => {
      this.isCollapsed = state.collapsed;
      this.isMobileOpen = state.mobileOpen;
      this.viewportWidth = state.viewportWidth;
    });
    this.restoreOpenGroups();
    this.openActiveGroup();
    void this.getRole();
    void this.plantScope.initialize(true);
    this.plantSubscription = this.plantScope.state$.subscribe(state => {
      this.plantState = state;
      if (state.profile) this.applyUserProfile(state.profile);
    });
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.openActiveGroup();
        this.closeMobileMenu();
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.layoutSubscription?.unsubscribe();
    this.plantSubscription?.unsubscribe();
  }

  get pageTitle() { return this.currentPageMeta.title; }
  get pageDescription() { return this.currentPageMeta.description; }
  get isMobile() { return this.viewportWidth < 768; }
  get isSearching() { return Boolean(this.normalizedSearch); }
  get roleLabel() {
    if (this.userRole === 'admin') return 'Administrador';
    if (this.userRole === 'capturista') return 'Capturista';
    if (this.userRole === 'planta') return 'Responsable de planta';
    return 'Usuario';
  }

  get visibleGroups(): NavigationGroup[] {
    const search = this.normalizedSearch;
    return this.navigation.filter(group => this.menuSections.has(group.id)).map(group => {
      const visibleItems = group.items.filter(item => this.canView(item));
      if (!search) return { ...group, items: visibleItems };
      const groupMatches = this.normalize(group.label).includes(search);
      return {
        ...group,
        items: visibleItems.filter(item => groupMatches || this.searchableText(group, item).includes(search)),
      };
    }).filter(group => group.items.length > 0);
  }

  async getRole() {
    const user = await this.storageService.get('currentUser');
    this.userRole = String(user?.rol || '').trim().toLowerCase();
    this.userName = user?.usuario || user?.email || 'Usuario';
    this.menuSections = new Set(normalizeNavigationSections(this.userRole, user?.seccionesMenu));
  }

  onResize() { this.sidebarLayout.handleResize(window.innerWidth); }

  onEscape() { this.sidebarLayout.closeMobile(); }

  toggleSidebar() {
    this.sidebarLayout.toggle();
  }

  toggleGroup(group: NavigationGroup) {
    if (!group.collapsible) return;
    if (this.isCollapsed && !this.isMobile) {
      this.sidebarLayout.expand();
      this.openGroups.add(group.id);
      this.persistOpenGroups();
      return;
    }
    if (this.openGroups.has(group.id)) this.openGroups.delete(group.id);
    else this.openGroups.add(group.id);
    this.persistOpenGroups();
  }

  isGroupOpen(group: NavigationGroup): boolean {
    return !group.collapsible || this.isSearching || this.openGroups.has(group.id);
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  clearSearch() {
    this.searchQuery = '';
    this.navigationSearch?.nativeElement.focus();
  }

  openSearch() {
    if (this.isCollapsed && !this.isMobile) {
      this.sidebarLayout.expand();
    }
    setTimeout(() => this.navigationSearch?.nativeElement.focus());
  }

  closeMobileMenu() {
    this.sidebarLayout.closeMobile();
  }

  isActive(path: string) {
    const item = this.navigation.flatMap(group => group.items).find(candidate => candidate.route === path);
    return item ? this.itemIsActive(item) : false;
  }

  navigate(item: NavigationItem) { return this.router.navigateByUrl(item.route, { replaceUrl: true }); }
  rToMiPerfil(){ return this.router.navigateByUrl('/mi-perfil', {replaceUrl: true}); }

  logout(){
    this.sidebarLayout.deactivateShell();
    this.authService.logout();
    this.storageService.clear();
    this.router.navigateByUrl('/login', {replaceUrl: true});
  }

  onPlantChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.plantScope.setActivePlant(value || null);
  }

  plantOptionLabel(plantId: string): string {
    const plant = this.plantState.plants.find(item => item.id === plantId);
    const suffix = this.plantScope.canWritePlant(plantId) ? '' : ' — Solo lectura';
    return `${plant?.nombre || plantId}${suffix}`;
  }

  private get normalizedSearch(): string {
    return this.normalize(this.searchQuery.trim());
  }

  private get currentPageMeta() {
    if (EXTRA_PAGE_TITLES[this.titulo]) return EXTRA_PAGE_TITLES[this.titulo];
    const current = this.navigation.flatMap(group => group.items).find(item => this.itemIsActive(item));
    return current ? { title: current.title, description: current.description } : { title: 'Autolog', description: '' };
  }

  private canView(item: NavigationItem): boolean {
    if (item.permission === 'admin') return this.userRole === 'admin';
    if (item.permission === 'global') return ['admin', 'capturista', 'planta'].includes(this.userRole);
    return true;
  }

  private searchableText(group: NavigationGroup, item: NavigationItem): string {
    return this.normalize([group.label, item.label, ...item.keywords].join(' '));
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private itemIsActive(item: NavigationItem): boolean {
    const current = this.normalizedUrl(this.router.url);
    const target = this.normalizedUrl(item.route);
    return item.match === 'prefix'
      ? current === target || current.startsWith(target + '/')
      : current === target;
  }

  private normalizedUrl(value: string): string {
    const [beforeFragment, fragment] = value.split('#', 2);
    const path = beforeFragment.split('?', 1)[0].replace(/\/$/, '') || '/';
    return fragment ? `${path}#${fragment}` : path;
  }

  private openActiveGroup() {
    const active = this.navigation.find(group => group.collapsible && group.items.some(item => this.itemIsActive(item)));
    if (active) {
      this.openGroups.add(active.id);
      this.persistOpenGroups();
    }
  }

  private restoreOpenGroups() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.openGroupsStorageKey) || '[]');
      if (Array.isArray(saved)) this.openGroups = new Set(saved.filter(id => this.navigation.some(group => group.id === id)));
    } catch {
      this.openGroups = new Set<string>();
    }
  }

  private persistOpenGroups() {
    localStorage.setItem(this.openGroupsStorageKey, JSON.stringify([...this.openGroups]));
  }

  private applyUserProfile(profile: { rol: string; usuario: string; email: string; seccionesMenu: NavigationSectionId[] }): void {
    this.userRole = String(profile.rol || '').trim().toLowerCase();
    this.userName = profile.usuario || profile.email || 'Usuario';
    this.menuSections = new Set(normalizeNavigationSections(this.userRole, profile.seccionesMenu));
  }

}
