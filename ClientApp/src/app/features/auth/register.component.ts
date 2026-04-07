import { AfterViewInit, Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements AfterViewInit {
  busy = false;
  ok: string | null = null;
  error: string | null = null;
  googleReady = false;

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.initializeGoogleButton();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.busy = true;
    this.ok = null;
    this.error = null;

    try {
      const username = this.form.value.username ?? '';
      const email = this.form.value.email ?? '';
      const password = this.form.value.password ?? '';

      await this.auth.register(username, email, password);
      this.ok = 'User Created. Please login.';
      setTimeout(() => this.router.navigateByUrl('/login'), 800);
    } catch (e: unknown) {
      this.error = this.getFriendlyErrorMessage(e);
    } finally {
      this.busy = false;
    }
  }

  onGoogleButtonClick(): void {
    if (!this.googleReady) {
      this.error = 'Google sign-up is not ready yet. Please try again.';
      return;
    }

    const username = this.form.value.username ?? '';
    if (!username.trim()) {
      this.error = 'Username is required before Google sign-up.';
      return;
    }

    const googleMountElement = document.getElementById('googleRegisterButton');
    const buttonElement = googleMountElement?.querySelector('div[role="button"]') as HTMLElement | null;
    if (!buttonElement) {
      this.error = 'Google sign-up is unavailable right now. Please refresh and try again.';
      return;
    }

    buttonElement.click();
  }

  private initializeGoogleButton(): void {
    if (!environment.googleClientId) {
      return;
    }

    if (!window.google?.accounts?.id) {
      window.setTimeout(() => this.initializeGoogleButton(), 200);
      return;
    }

    const buttonElement = document.getElementById('googleRegisterButton');
    if (!buttonElement) {
      return;
    }

    buttonElement.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential?: string }) => {
        void this.handleGoogleRegister(response.credential);
      }
    });

    window.google.accounts.id.renderButton(buttonElement, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'signup_with',
      width: 320
    });

    this.googleReady = true;
  }

  private async handleGoogleRegister(idToken?: string): Promise<void> {
    const username = this.form.value.username ?? '';

    if (!username.trim()) {
      this.error = 'Username is required before Google sign-up.';
      return;
    }

    this.busy = true;
    this.ok = null;
    this.error = null;

    try {
      await this.auth.googleRegister(username, idToken ?? '');

      await this.ngZone.run(async () => {
        await this.router.navigateByUrl('/app');
      });
    } catch (e: unknown) {
      this.error = this.getFriendlyErrorMessage(e);
    } finally {
      this.busy = false;
    }
  }

  private getFriendlyErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to reach the server. Please ensure the backend is running.';
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }

      return 'Signup failed. Please try again.';
    }

    return 'Signup failed. Please try again.';
  }
}
