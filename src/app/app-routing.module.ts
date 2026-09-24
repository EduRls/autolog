import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { redirectLoggedInTo, canActivate } from '@angular/fire/auth-guard';
import { adminGuard } from './guards/admin.guard';
import { attendanceGuard } from './guards/attendance.guard';
import { autologAccessGuard } from './guards/autolog-access.guard';
import { navigationSectionGuard } from './guards/navigation-section.guard';

const redirectLoggedInToHome = () => redirectLoggedInTo(['panel-control']);
export const APP_ROUTES: Routes = [
  {
    path: 'plantas',
    loadComponent: () => import('./plantas/plantas.page').then(m => m.PlantasPage),
    canActivate: [adminGuard, navigationSectionGuard],
    data: { navigationSection: 'administration' }
  },
  {
    path: 'reloj/login',
    loadComponent: () => import('./reloj/reloj-login.page').then(m => m.RelojLoginPage)
  },
  {
    path: 'reloj',
    loadComponent: () => import('./reloj/reloj.page').then(m => m.RelojPage),
    canActivate: [attendanceGuard]
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'general' }
  },
  {
    path: '',
    redirectTo: 'panel-control',
    pathMatch: 'full'
  },
  {
    path: 'autos',
    loadChildren: () => import('./autos/autos.module').then( m => m.AutosPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'fleet' }
  },
  {
    path: 'articulos',
    loadChildren: () => import('./articulos/articulos.module').then( m => m.ArticulosPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'fleet' }
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./usuarios/usuarios.module').then( m => m.UsuariosPageModule),
    canActivate: [adminGuard, navigationSectionGuard],
    data: { navigationSection: 'administration' }
  },
  {
    path: 'mi-perfil',
    loadChildren: () => import('./mi-perfil/mi-perfil.module').then( m => m.MiPerfilPageModule),
    canActivate: [autologAccessGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule),
    ...canActivate(redirectLoggedInToHome)
  },
  {
    path: 'prueba',
    loadChildren: () => import('./prueba/prueba.module').then( m => m.PruebaPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'panel-control',
    loadChildren: () => import('./ventas/panel-control/panel-control.module').then( m => m.PanelControlPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'distribuidores',
    loadChildren: () => import('./ventas/distribuidores/distribuidores.module').then( m => m.DistribuidoresPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'fleet' }
  },
  {
    path: 'incidentes',
    loadChildren: () => import('./ventas/incidentes/incidentes.module').then( m => m.IncidentesPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'productos',
    loadChildren: () => import('./ventas/productos/productos.module').then( m => m.ProductosPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'historial',
    loadChildren: () => import('./ventas/historial/historial.module').then( m => m.HistorialPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'generar-codigos',
    loadChildren: () => import('./ventas/generar-codigos/generar-codigos.module').then( m => m.GenerarCodigosPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'convertidor-dictamen',
    loadChildren: () => import('./herramientas/convertidor-dictamen/convertidor-dictamen.module').then( m => m.ConvertidorDictamenPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'sorteos',
    loadChildren: () => import('./ventas/sorteos/sorteos.module').then( m => m.SorteosPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'sales' }
  },
  {
    path: 'panel-expendio',
    loadChildren: () => import('./expendio/panel-expendio/panel-expendio.module').then(m => m.PanelExpendioPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'station' }
  },
  {
    path: 'registro-ventas',
    loadChildren: () => import('./expendio/registro-ventas/registro-ventas.module').then(m => m.RegistroVentasPageModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'station' }
  },
  {
    path: 'asistencia',
    loadChildren: () => import('./asistencia/asistencia.module').then(m => m.AsistenciaModule),
    canActivate: [autologAccessGuard, navigationSectionGuard],
    data: { navigationSection: 'attendance' }
  },
  {
    path: 'politicas',
    loadChildren: () => import('./politicas/politicas.module').then( m => m.PoliticasPageModule)
  },
  {
    path: 'politicas-pda',
    loadChildren: () => import('./politicas-pda/politicas-pda.module').then( m => m.PoliticasPdaPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(APP_ROUTES, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
