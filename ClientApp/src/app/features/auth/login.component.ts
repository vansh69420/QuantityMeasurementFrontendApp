import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';

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
export class LoginComponent {
  busy = false;
  error: string | null = null;

  form = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

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
    } catch (e: any) {
      this.error = e?.error ?? e?.error?.message ?? 'Login failed.';
    } finally {
      this.busy = false;
    }
  }
}
