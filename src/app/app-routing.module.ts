import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { redirectUnauthorizedTo, redirectLoggedInTo, canActivate } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['panel-control']);
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: '',
    redirectTo: 'panel-control',
    pathMatch: 'full'
  },
  {
    path: 'autos',
    loadChildren: () => import('./autos/autos.module').then( m => m.AutosPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'articulos',
    loadChildren: () => import('./articulos/articulos.module').then( m => m.ArticulosPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./usuarios/usuarios.module').then( m => m.UsuariosPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'mi-perfil',
    loadChildren: () => import('./mi-perfil/mi-perfil.module').then( m => m.MiPerfilPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule),
    ...canActivate(redirectLoggedInToHome)
  },
  {
    path: 'prueba',
    loadChildren: () => import('./prueba/prueba.module').then( m => m.PruebaPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'panel-control',
    loadChildren: () => import('./ventas/panel-control/panel-control.module').then( m => m.PanelControlPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'distribuidores',
    loadChildren: () => import('./ventas/distribuidores/distribuidores.module').then( m => m.DistribuidoresPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'incidentes',
    loadChildren: () => import('./ventas/incidentes/incidentes.module').then( m => m.IncidentesPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'productos',
    loadChildren: () => import('./ventas/productos/productos.module').then( m => m.ProductosPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'historial',
    loadChildren: () => import('./ventas/historial/historial.module').then( m => m.HistorialPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'generar-codigos',
    loadChildren: () => import('./ventas/generar-codigos/generar-codigos.module').then( m => m.GenerarCodigosPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'convertidor-dictamen',
    loadChildren: () => import('./herramientas/convertidor-dictamen/convertidor-dictamen.module').then( m => m.ConvertidorDictamenPageModule)
  },
  {
    path: 'sorteos',
    loadChildren: () => import('./ventas/sorteos/sorteos.module').then( m => m.SorteosPageModule)
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
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
