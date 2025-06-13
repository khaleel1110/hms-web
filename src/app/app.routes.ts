import { Routes } from '@angular/router';
import {HomeComponent} from './features/home/home.component';
import {BookingComponent} from './features/booking/booking.component';
import {AboutComponent} from './features/about/about.component';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full' // Redirect empty path to /home
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'booking',
    component: BookingComponent
  },  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'date-picker',
    loadComponent: () => import('./features/date-picker/date-picker.component')
      .then(c => c.DatePickerComponent)
  },
  {
    path: 'date',
    loadComponent: () => import('./features/date/date.component')
      .then(c => c.DateComponent)
  },
  {
    path: 'doctor-booking/:id',
    loadComponent: () => import('./features/doctor-booking/doctor-booking.component')
      .then(c => c.DoctorBookingComponent)
  },
];
