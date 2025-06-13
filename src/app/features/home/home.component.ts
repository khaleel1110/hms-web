import { Component, OnInit } from '@angular/core';
import Typed from 'typed.js';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {
  NgbAccordionButton, NgbAccordionCollapse,
  NgbAccordionDirective,
  NgbAccordionHeader,
  NgbAccordionItem
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionButton,
    NgbAccordionCollapse
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    const options = {
      strings: [
        'Book Your Appointment',
        'Connect with Certified Doctors',
        'Get Instant Notifications',
        'Reschedule with Ease',
        'Access Medical Help Quickly'
      ],
      typeSpeed: 80,
      backSpeed: 30,
      backDelay: 2500,
      showCursor: true,
      cursorChar: '|',
      loop: true
    };

    new Typed('.js-typedjs', options);
  }
}
