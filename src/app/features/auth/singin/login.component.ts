import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { getApiErrorMessage } from '../../../Core/models/api-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-shell.css',
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' };
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  private readonly authService = inject(UsuariosService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.updateAuthState()) {
      void this.router.navigate(['/libros']);
    }
  }

  onLogin(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/libros']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.authService.clearSession();
        this.errorMessage.set(
          getApiErrorMessage(
            err,
            err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
          ),
        );
      },
    });
  }
}
