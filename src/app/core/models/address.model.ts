export interface Address {
  _id?: string;
  name: string;
  location: string;
  addressType: 'Home' | 'Office';
  flat: string;
  poBox: string;
  street: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  fullAddress: string;
  paymentMethod: string;
}
