import {Component, inject} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {UsersService} from '../../services/users.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {DatePipe, NgForOf, NgIf} from '@angular/common';

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
  private usersService = inject(UsersService);
  bookings = toSignal(this.usersService.users$, { initialValue: [] });


  departments: Department[] = [
    {
      id: 'physiotherapy',
      imageSrc: '/Physiotherapy-1.png',
      title: 'Physiotherapy',
      description: 'Specialized care for physical rehabilitation and mobility improvement.',
      linkText: 'Book Now',
      aosDelay: '0'
    },
    {
      id: 'cardiology',
      imageSrc: '/Cardiology.jpg',
      title: 'Cardiology',
      description: 'Expert care for heart and cardiovascular conditions.',
      linkText: 'Book Now',
      aosDelay: '150'
    },
    {
      id: 'neurology',
      imageSrc: '/Neurology.jpg',
      title: 'Neurology',
      description: 'Advanced treatment for neurological disorders and conditions.',
      linkText: 'Book Now',
      aosDelay: '200'
    },
    {
      id: 'orthopedics',
      imageSrc: '/orthorpedics.jpeg',
      title: 'Orthopedics',
      description: 'Comprehensive care for bones, joints, and muscles.',
      linkText: 'Book Now',
      aosDelay: '250'
    },
    {
      id: 'pediatrics',
      imageSrc: '/new-pediatrics.webp',
      title: 'Pediatrics',
      description: 'Dedicated care for infants, children, and adolescents.',
      linkText: 'Book Now',
      aosDelay: '300'
    },
    {
      id: 'radiology',
      imageSrc: '/radiology.jpg',
      title: 'Radiology',
      description: 'State-of-the-art imaging and diagnostic services.',
      linkText: 'Book Now',
      aosDelay: '350'
    },
    {
      id: 'oncology',
      imageSrc: '/oncology.jpeg',
      title: 'Oncology',
      description: 'Specialized treatment for cancer care and management.',
      linkText: 'Book Now',
      aosDelay: '400'
    },
    {
      id: 'endocrinology',
      imageSrc: '/endocrilonogy.webp',
      title: 'Endocrinology',
      description: 'Expert care for hormonal and metabolic disorders.',
      linkText: 'Book Now',
      aosDelay: '450'
    }
  ];
}
