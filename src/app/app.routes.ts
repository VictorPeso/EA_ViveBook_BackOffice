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
      import('./features/auth/singin/login.component').then((m) => m.LoginComponent),
    title: 'BackOffice - Login',
  },
  {
    path: 'auth/signup',
    loadComponent: () =>
      import('./features/auth/singup/signup.component').then((m) => m.SignupComponent),
    title: 'BackOffice - Registro',
  },
  {
    path: 'auth/signin',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'libros',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/libros/pages/libros-page/libros-page.component').then(
        (m) => m.LibrosPageComponent,
      ),
    title: 'BackOffice - Libros',
  },
  {
    path: 'autores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/autores/pages/autores-page/autores-page.component').then(
        (m) => m.AutoresPageComponent,
      ),
    title: 'BackOffice - Autores',
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent,
      ),
    title: 'BackOffice - Usuarios',
  },
  {
    path: 'librerias',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/librerias/pages/librerias-page/librerias-page.component').then(
        (m) => m.LibreriasPageComponent,
      ),
    title: 'BackOffice - Librerías',
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/pages/posts-page/posts-page').then((m) => m.PostsPage),
    title: 'Posts',
  },
  {
    path: 'eventos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/eventos/pages/eventos-page/eventos-page.component').then(
        (m) => m.EventosPageComponent,
      ),
    title: 'BackOffice - Eventos',
  },
  {
    path: 'valoraciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/valoraciones/pages/valoraciones-page/valoraciones-page.component').then(
        (m) => m.ValoracionesPageComponent,
      ),
    title: 'BackOffice - Valoraciones',
  },
  {
    path: 'reservas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservas/pages/reservas-page/reservas-page.component').then(
        (m) => m.ReservasPageComponent,
      ),
    title: 'BackOffice - Reservas',
  },
  {
    path: 'retos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/retos/pages/retos-page/retos-page.component').then(
        (m) => m.RetosPageComponent,
      ),
    title: 'BackOffice - Retos',
  },
  {
    path: 'matomo',
    loadComponent: () =>
      import('./features/matomo/matomo-page/matomo-page').then((m) => m.MatomoPage),
    title: 'Matomo',
  },
];
