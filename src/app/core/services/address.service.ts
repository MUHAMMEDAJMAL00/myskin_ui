import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Address } from '../models/address.model';

const ADDRESS_KEY = 'myskin_web_addresses';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private addressesSubject = new BehaviorSubject<Address[]>(this.readAddresses());
  addresses$ = this.addressesSubject.asObservable();

  get addresses(): Address[] {
    return this.addressesSubject.value;
  }

  constructor(private api: ApiService) {}

  save(address: Address): Address {
    const saved: Address = { ...address, _id: address._id || `addr_${Date.now()}` };
    const addresses = address._id
      ? this.addressesSubject.value.map((a) => (a._id === address._id ? saved : a))
      : [...this.addressesSubject.value, saved];
    this.persist(addresses);

    this.api.post('/customer-address', {
      name: address.name, phone: address.phone, address_type: address.addressType,
      full_address: address.fullAddress, street: address.street, city: address.city,
      state: address.state, country: address.country, postal_code: address.poBox,
    }).subscribe({ error: () => {} });

    return saved;
  }

  remove(id: string): void {
    this.persist(this.addressesSubject.value.filter((a) => a._id !== id));
  }

  private persist(addresses: Address[]): void {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses));
    this.addressesSubject.next(addresses);
  }

  private readAddresses(): Address[] {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
