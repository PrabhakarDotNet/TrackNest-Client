import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  message = '';
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: SignupComponent.passwordsMatch });
  }

  static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass && confirm && pass === confirm ? null : { passwordsMismatch: true };
  }

  signup(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.message = '';

    this.signupForm.markAllAsTouched();

    if (this.signupForm.invalid) {
      if (this.signupForm.errors?.['passwordsMismatch']) {
        this.message = 'Passwords do not match.';
      } else {
        this.message = 'Please fill in all fields correctly.';
      }
      return;
    }

    const { username, email, password } = this.signupForm.value;
    console.log('Signup submit:', JSON.stringify({ username, email }));
    this.loading = true;
    this.authService.signup(username, email, password).subscribe({
      next: (success) => {
        console.log('Signup response:', success);
        this.loading = false;
        if (success) {
          this.router.navigate(['expenses']);
        } else {
          this.message = 'Unable to sign up. Please try again.';
        }
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.loading = false;

        const backendMessage =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'Server error during signup. Please try again later.';

        this.message = backendMessage;
      }
    });
  }
}
