import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  message = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    this.message = '';
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.message = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.authService.signup(this.username, this.email, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.router.navigate(['expenses']);
        } else {
          this.message = 'Unable to sign up. Please try again.';
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Server error during signup. Please try again later.';
      }
    });
  }
}
