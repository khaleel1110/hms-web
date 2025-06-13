import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LayOutComponent} from './core/lay-out/lay-out.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayOutComponent, LayOutComponent],
  template: `<app-lay-out></app-lay-out>`,

})
export class AppComponent {
  title = 'hospital-m-web';
}
