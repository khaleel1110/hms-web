import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {UsersService} from '../../services/users.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {BookingService} from '../../services/booking.service';

interface Department {
  id: string;
  imageSrc: string;
  title: string;
  description: string;
  linkText: string;
  aosDelay?: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    DatePipe,
    NgForOf,
    NgIf,
    RouterLinkActive
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent {
  private bookingService = inject(BookingService);
  private router = inject(Router);

  // Signals
  allDepartments = toSignal(this.bookingService.departments$, { initialValue: [] });
}
