import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../../Core/services/usuarios.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  readonly appName = 'ViveBook Backoffice';

  private readonly authService = inject(UsuariosService);

  readonly isLoggedIn = this.authService.isAuthenticated;

  logout(): void {
    this.authService.logout();
  }
}
