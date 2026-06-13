import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { UsuariosService } from './Core/services/usuarios.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly authService = inject(UsuariosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUrl = signal(this.router.url);

  readonly isLoggedIn = this.authService.isAuthenticated;
  readonly showAdminLayout = computed(
    () => this.isLoggedIn() && !this.isPublicAuthRoute(this.currentUrl()),
  );

  readonly navigation = [
    { label: 'Autor', route: '/autores', shortLabel: 'AU' },
    { label: 'Evento', route: '/eventos', shortLabel: 'EV' },
    { label: 'Libro', route: '/libros', shortLabel: 'LI' },
    { label: 'Post', route: '/posts', shortLabel: 'PO' },
    { label: 'Reto', route: '/retos', shortLabel: 'RE' },
    { label: 'Usuario', route: '/usuarios', shortLabel: 'US' },
    { label: 'Valoracion', route: '/valoraciones', shortLabel: 'VA' },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  private isPublicAuthRoute(url: string): boolean {
    return url === '/auth' || url.startsWith('/auth/');
  }
}
