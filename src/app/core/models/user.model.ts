export interface Customer {
  id: number;
  store_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface AuthData {
  token: string;
  refresh_token: string;
  customer: Customer;
}

export interface AuthState {
  customer: Customer | null;
  token: string;
  refreshToken: string;
  isAuthenticated: boolean;
}
