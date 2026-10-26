import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.toast.error('Please enter email and password');
      return;
    }

    this.loading = true;
    try {
      await this.auth.login(this.email, this.password);
      this.toast.success('Login successful!');
      this.router.navigate(['/']);
    } catch (err: any) {
      this.toast.error(err.message || 'Login failed');
    } finally {
      this.loading = false;
    }
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
