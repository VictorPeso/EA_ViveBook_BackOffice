import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule, 
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credentials = { email: '', password: '' };

  constructor(private authService: UsuariosService, private router: Router) {}

  onLogin() {
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.router.navigate(['/libros']);
      },
      error: (err) => {
        alert('Error al iniciar sesión: Revisa tus credenciales');
      }
    });
  }
}