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
export class RegisterComponent {
  busy = false;
  ok: string | null = null;
  error: string | null = null;

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
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
    this.ok = null;
    this.error = null;

    try {
      const username = this.form.value.username ?? '';
      const email = this.form.value.email ?? '';
      const password = this.form.value.password ?? '';

      await this.auth.register(username, email, password);
      this.ok = 'User Created. Please login.';
      setTimeout(() => this.router.navigateByUrl('/login'), 800);
    } catch (e: any) {
      this.error = e?.error ?? e?.error?.message ?? 'Signup failed.';
    } finally {
      this.busy = false;
    }
  }
}
