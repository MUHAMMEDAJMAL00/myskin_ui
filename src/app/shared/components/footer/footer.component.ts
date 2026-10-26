import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  readonly year = new Date().getFullYear();
  categories: Category[] = [];
  email = '';

  readonly helpLinks = ['Contact Us', 'FAQs', 'Shipping & Delivery', 'Returns & Refunds', 'Order Tracking'];
  readonly quickLinks = ['About Us', 'Blog', 'Careers', 'Privacy Policy', 'Terms & Conditions'];
  readonly socials = [
    { icon: 'bi-instagram', label: 'Instagram', url: 'https://instagram.com' },
    { icon: 'bi-facebook', label: 'Facebook', url: 'https://facebook.com' },
    { icon: 'bi-youtube', label: 'YouTube', url: 'https://youtube.com' },
    { icon: 'bi-twitter-x', label: 'X', url: 'https://x.com' },
    { icon: 'bi-pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
  ];

  constructor(
    private categoryService: CategoryService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.categoryService.getTopLevel().subscribe({
      next: (categories) => (this.categories = categories.slice(0, 6)),
      error: () => (this.categories = []),
    });
  }

  subscribe(): void {
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.toast.error('Please enter a valid email address');
      return;
    }
    this.toast.success('Thanks for subscribing to MySkin!');
    this.email = '';
  }
}
