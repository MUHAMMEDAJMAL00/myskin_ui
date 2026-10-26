import { Component } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
  animations: [
    trigger('pageTransition', [
      transition('* <=> *', [
        query(':enter', [style({ opacity: 0 }), animate('300ms ease', style({ opacity: 1 }))], { optional: true }),
      ]),
    ]),
  ],
})
export class AppComponent {}
