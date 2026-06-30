import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  message = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
  this.message = '';
  if (!this.username || !this.password) {
    this.message = 'Please enter both username and password.';
    return;
  }

  this.loading = true;
  this.authService.login({ username: this.username, password: this.password }).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    },
    error: () => {
      this.loading = false;
      this.message = 'Invalid credentials. Please try again.';
    }
  });
}
}