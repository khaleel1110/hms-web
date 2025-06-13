import { Component } from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';

@Component({
  selector: 'app-lay-out',
  standalone: true,
  imports: [
    HeaderComponent,
    RouterOutlet,
    FooterComponent
  ],
  template: `
    <app-header></app-header>
   <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
})
export class LayOutComponent {

}
