import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  isLoading = false;

  constructor(
    private authService: UsuariosService,
    private router: Router,
  ) {}

  onLogin() {
    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        localStorage.setItem('token', res.token);
        this.authService.updateAuthState();
        this.router.navigate(['/libros']);
      },
      error: (err) => {
        this.isLoading = false;
        localStorage.removeItem('token');
        this.authService.isAuthenticated.set(false);
        alert('Error: ' + (err.error || 'Credenciales incorrectas'));
      },
    });
  }
}
