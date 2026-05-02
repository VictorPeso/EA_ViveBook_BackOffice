import { Routes } from '@angular/router';
import { title } from 'process';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'libros',
  },
  {
    path: 'libros',
    loadComponent: () =>
      import('./features/libros/pages/libros-page/libros-page.component').then(
        (m) => m.LibrosPageComponent
      ),
    title: 'BackOffice - Libros',
  },
  {
    path: 'autores',
    loadComponent: () =>
      import('./features/autores/pages/autores-page/autores-page.component').then(
        (m) => m.AutoresPageComponent
      ),
    title: 'BackOffice - Autores',
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent
      ),
    title: 'BackOffice - Usuarios',
  },
{
  path: 'posts',
  loadComponent: () => 
    import('./features/posts/pages/posts-page/posts-page').then(
      (m) => m.PostsPage
    ),
    title: 'Posts'
  }
  ,
  {
    path: '**',
    redirectTo: 'libros',
  },
];