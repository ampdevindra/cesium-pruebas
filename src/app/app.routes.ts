import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'cesium', loadComponent: () => import('./pagina-demo/pagina-demo.component').then(m => m.PaginaDemo) },
  { path: '', pathMatch: 'full', redirectTo: 'cesium' },
];
