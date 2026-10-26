import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer, AuthData } from '../models/user.model';
import { ApiService } from './api.service';

const TOKEN_KEY = 'myskin_web_token';
const REFRESH_KEY = 'myskin_web_refresh';
const CUSTOMER_KEY = 'myskin_web_customer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private customerSubject = new BehaviorSubject<Customer | null>(this.readCustomer());
  private tokenSubject = new BehaviorSubject<string>(localStorage.getItem(TOKEN_KEY) || '');
  private refreshSubject = new BehaviorSubject<string>(localStorage.getItem(REFRESH_KEY) || '');

  customer$ = this.customerSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  refreshToken$ = this.refreshSubject.asObservable();

  get currentCustomer(): Customer | null {
    return this.customerSubject.value;
  }

  get token(): string {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.customerSubject.value;
  }

  constructor(private api: ApiService) {}

  login(email: string, password: string): Promise<AuthData> {
    return new Promise((resolve, reject) => {
      this.api.post<AuthData>('/customer-auth/login', { email, password }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.setSession(res.data);
            resolve(res.data);
          } else {
            reject(new Error(res.message || 'Login failed'));
          }
        },
        error: (err) => {
          const msg = err.error?.message || 'Login failed';
          reject(new Error(msg));
        },
      });
    });
  }

  signup(data: { name: string; email: string; password: string; confirm_password: string; phone?: string }): Promise<AuthData> {
    return new Promise((resolve, reject) => {
      this.api.post<AuthData>('/customer-auth/signup', data).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.setSession(res.data);
            resolve(res.data);
          } else {
            reject(new Error(res.message || 'Signup failed'));
          }
        },
        error: (err) => {
          const msg = err.error?.message || 'Signup failed';
          reject(new Error(msg));
        },
      });
    });
  }

  logout(): void {
    this.api.post('/customer-auth/logout').subscribe({ next: () => {} });
    this.clearSession();
  }

  fetchProfile(): Promise<Customer> {
    return new Promise((resolve, reject) => {
      this.api.get<Customer>('/customer-auth/me').subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.storeCustomer(res.data);
            resolve(res.data);
          } else {
            reject(new Error('Failed to fetch profile'));
          }
        },
        error: (err) => {
          this.clearSession();
          reject(err);
        },
      });
    });
  }

  updateProfile(data: Partial<Customer>): Promise<Customer> {
    return new Promise((resolve, reject) => {
      this.api.patch<Customer>('/customer-auth/me', data).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.storeCustomer(res.data);
            resolve(res.data);
          } else {
            reject(new Error(res.message || 'Failed to update profile'));
          }
        },
        error: (err) => reject(new Error(err.error?.message || 'Failed to update profile')),
      });
    });
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.post('/customer-auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }).subscribe({
        next: (res: any) => {
          if (res.success) resolve();
          else reject(new Error(res.message || 'Failed to change password'));
        },
        error: (err) => reject(new Error(err.error?.message || 'Failed to change password')),
      });
    });
  }

  private setSession(data: AuthData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
    this.tokenSubject.next(data.token);
    this.refreshSubject.next(data.refresh_token);
    this.storeCustomer(data.customer);
  }

  private storeCustomer(customer: Customer): void {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    this.customerSubject.next(customer);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    this.tokenSubject.next('');
    this.refreshSubject.next('');
    this.customerSubject.next(null);
  }

  private readCustomer(): Customer | null {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
