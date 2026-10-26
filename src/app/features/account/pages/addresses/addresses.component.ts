import { Component, OnInit } from '@angular/core';
import { AddressService } from '../../../../core/services/address.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Address } from '../../../../core/models/address.model';

@Component({
  standalone: false,
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss',
})
export class AddressesComponent implements OnInit {
  addresses: Address[] = [];
  showForm = false;
  editingId: string | null = null;
  form: Address = this.emptyForm();

  constructor(private addressService: AddressService, private toast: ToastService) {}

  ngOnInit(): void {
    this.addresses = this.addressService.addresses;
    this.addressService.addresses$.subscribe((a) => (this.addresses = a));
  }

  emptyForm(): Address {
    return { name: '', phone: '', fullAddress: '', city: '', state: '', country: 'India', addressType: 'Home', flat: '', poBox: '', street: '', location: '', paymentMethod: '' };
  }

  openNew(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  openEdit(addr: Address): void {
    this.editingId = addr._id || null;
    this.form = { ...addr };
    this.showForm = true;
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  save(): void {
    this.addressService.save({ ...this.form, _id: this.editingId || undefined });
    this.toast.success('Address saved');
    this.cancel();
  }

  remove(id: string): void {
    if (confirm('Delete this address?')) {
      this.addressService.remove(id);
      this.toast.info('Address removed');
    }
  }
}
