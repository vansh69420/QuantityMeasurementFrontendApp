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
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  busy = false;
  error: string | null = null;
  hidePassword = true;
  googleReady = false;

  form = this.fb.group({
    login: ['', Validators.required],
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
    this.error = null;

    try {
      const login = this.form.value.login ?? '';
      const password = this.form.value.password ?? '';

      await this.auth.login(login, password);
      await this.router.navigateByUrl('/app');
    } catch (e: unknown) {
      this.error = this.getFriendlyErrorMessage(e);
    } finally {
      this.busy = false;
    }
  }

  onGoogleButtonClick(): void {
    if (!this.googleReady) {
      this.error = 'Google sign-in is not ready yet. Please try again.';
      return;
    }

    const googleMountElement = document.getElementById('googleLoginButton');
    const buttonElement = googleMountElement?.querySelector('div[role="button"]') as HTMLElement | null;
    if (!buttonElement) {
      this.error = 'Google sign-in is unavailable right now. Please refresh and try again.';
      return;
    }

    buttonElement.click();
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private initializeGoogleButton(): void {
    if (!environment.googleClientId) {
      return;
    }

    if (!window.google?.accounts?.id) {
      window.setTimeout(() => this.initializeGoogleButton(), 200);
      return;
    }

    const buttonElement = document.getElementById('googleLoginButton');
    if (!buttonElement) {
      return;
    }

    buttonElement.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential?: string }) => {
        void this.handleGoogleLogin(response.credential);
      }
    });

    window.google.accounts.id.renderButton(buttonElement, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'signin_with',
      width: 320
    });

    this.googleReady = true;
  }

  private async handleGoogleLogin(idToken?: string): Promise<void> {
    if (!idToken) {
      this.error = 'Google sign-in did not return a valid token.';
      return;
    }

    this.busy = true;
    this.error = null;

    try {
      await this.auth.googleLogin(idToken);

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

      if (error.status === 401) {
        return 'Invalid username/email or password.';
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }

      return 'Login failed. Please try again.';
    }

    return 'Login failed. Please try again.';
  }
}
