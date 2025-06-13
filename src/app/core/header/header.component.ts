import { Component, inject, TemplateRef } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbOffcanvas,
  OffcanvasDismissReasons
} from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownMenu,
    RouterLink,
    NgbDropdownItem,
    NgbDropdownAnchor,
    RouterLinkActive,

  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private router = inject(Router);
  private offcanvasService = inject(NgbOffcanvas);
  closeResult = '';
  env = environment;

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.offcanvasService.dismiss('Due to navigation');
    });
  }

  open(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { ariaLabelledBy: 'offcanvas-basic-title', scroll: true }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      },
    );
  }

  private getDismissReason(reason: any): string {
    switch (reason) {
      case OffcanvasDismissReasons.ESC:
        return 'by pressing ESC';
      case OffcanvasDismissReasons.BACKDROP_CLICK:
        return 'by clicking on the backdrop';
      default:
        return `with: ${reason}`;
    }
  }
}
