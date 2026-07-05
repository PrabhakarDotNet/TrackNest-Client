import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { GoogleCredentialResponse } from '../../../../core/models/google-credential-response';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {

  loginForm: FormGroup;
  message = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.googleAuthService.initialize((response: GoogleCredentialResponse) => {
        this.handleGoogleLogin(response.credential);
      });

      const googleButton = document.getElementById('googleButton');

      if (googleButton) {
        await this.googleAuthService.renderButton(googleButton);
      } else {
        console.warn('#googleButton element not found in template.');
      }
    } catch (err) {
      console.error('Google Sign-In failed to initialize:', err);
      this.message = 'Google Sign-In is currently unavailable.';
    }
  }

  private handleGoogleLogin(idToken: string): void {
    this.loading = true;

    this.authService.googleLogin(idToken).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.message = 'Google login failed. Please try again.';
      }
    });
  }

  login(): void {
    this.message = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.message = 'Please enter both username and password.';
      return;
    }

    const { username, password } = this.loginForm.value;

    this.loading = true;

    this.authService.login({ username, password }).subscribe({
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