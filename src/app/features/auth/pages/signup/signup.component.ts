import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  async onSubmit(): Promise<void> {
    if (!this.name || !this.email || !this.password) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    this.loading = true;
    try {
      await this.auth.signup({
        name: this.name,
        email: this.email,
        phone: this.phone || undefined,
        password: this.password,
        confirm_password: this.confirmPassword,
      });
      this.toast.success('Account created successfully!');
      this.router.navigate(['/']);
    } catch (err: any) {
      this.toast.error(err.message || 'Registration failed');
    } finally {
      this.loading = false;
    }
  }
}
