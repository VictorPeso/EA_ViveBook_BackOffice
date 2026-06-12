import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { UsuariosService } from './Core/services/usuarios.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly authService = inject(UsuariosService);

  readonly isLoggedIn = this.authService.isAuthenticated;

  readonly navigation = [
    { label: 'Autor', route: '/autores', shortLabel: 'AU' },
    { label: 'Evento', route: '/eventos', shortLabel: 'EV' },
    { label: 'Libro', route: '/libros', shortLabel: 'LI' },
    { label: 'Post', route: '/posts', shortLabel: 'PO' },
    { label: 'Reto', route: '/retos', shortLabel: 'RE' },
    { label: 'Usuario', route: '/usuarios', shortLabel: 'US' },
    { label: 'Valoracion', route: '/valoraciones', shortLabel: 'VA' },
  ];
}
