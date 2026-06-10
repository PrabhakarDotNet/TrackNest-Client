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
    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.router.navigate(['expenses']);
        } else {
          this.message = 'Invalid credentials. Please try again.';
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Unable to login right now. Please try later.';
      }
    });
  }
}
