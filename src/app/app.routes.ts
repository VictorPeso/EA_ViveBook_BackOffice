import { Routes } from '@angular/router';
import { authGuard } from '././features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/singin/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'BackOffice - Login',
  },
  {
    path: 'auth/signup',
    loadComponent: () => import('./features/auth/singup/signup.component').then(m => m.SignupComponent),
    title: 'BackOffice - Registro'
  },
  {
    path: 'libros',
    canActivate: [authGuard], 
    loadComponent: () =>
      import('./features/libros/pages/libros-page/libros-page.component').then(
        (m) => m.LibrosPageComponent
      ),
    title: 'BackOffice - Libros',
  },
  {
    path: 'autores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/autores/pages/autores-page/autores-page.component').then(
        (m) => m.AutoresPageComponent
      ),
    title: 'BackOffice - Autores',
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent
      ),
    title: 'BackOffice - Usuarios',
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];