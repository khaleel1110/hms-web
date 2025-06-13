import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NgForOf, NgIf } from '@angular/common';

import { Subscription } from 'rxjs';


@Component({
  selector: 'app-date',
  standalone: true,
  imports: [
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    FormsModule,
    MatSelectModule,
    NgIf,
    NgForOf
  ],
  template: `
<!--    <div class=" ">
      <mat-form-field appearance="fill">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate" (dateChange)="onDateChange()" required>
        <mat-hint>MM/DD/YYYY</mat-hint>
        <mat-error *ngIf="!selectedDate">Date is required</mat-error>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <div *ngIf="selectedDate" class="time-picker mt-4">
        <mat-form-field appearance="fill" class="mr-2">
          <mat-label>Start Time</mat-label>
          <mat-select [(ngModel)]="selectedStartHour" (selectionChange)="updateTime()" required>
            <mat-option *ngFor="let slot of timeSlots" [value]="slot.startHour" [disabled]="slot.isBooked">
              {{ formatTime(slot.startHour) }}
              <span *ngIf="slot.isBooked" class="booked-badge">Booked</span>
            </mat-option>
          </mat-select>
          <mat-error *ngIf="selectedStartHour == null">Start time is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Duration (hours)</mat-label>
          <mat-select [(ngModel)]="selectedDuration" (selectionChange)="updateTime()" required>
            <mat-option *ngFor="let duration of availableDurations" [value]="duration.value" [disabled]="duration.isBlocked">
              {{ duration.value }} {{ duration.value === 1 ? 'hour' : 'hours' }}
              <span *ngIf="duration.isBlocked" class="blocked-badge">Blocked</span>
            </mat-option>
          </mat-select>
          <mat-error *ngIf="selectedDuration == null">Duration is required</mat-error>
        </mat-form-field>
      </div>

      <div *ngIf="selectedDate && selectedStartHour != null && selectedDuration != null" class="selected-info mt-4">
        <p><strong>Selected:</strong> {{ formatSelectedDateTime() }}</p>
      </div>
    </div>-->
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
    }

    .mat-form-field {
      width: 100%;
      max-width: 300px;
      margin: 16px;
    }

    .time-picker {
      display: flex;
      justify-content: center;
      width: 100%;
      max-width: 300px;
    }

    .time-picker .mat-form-field {
      width: 140px;
    }

    .selected-info {
      width: 100%;
      max-width: 300px;
      text-align: center;
    }

    .mr-2 {
      margin-right: 8px;
    }

    .booked-badge, .blocked-badge {
      background-color: #dc3545;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 8px;
    }

    .mat-option.mat-option-disabled .booked-badge,
    .mat-option.mat-option-disabled .blocked-badge {
      opacity: 0.7;
    }
  `]
})
export class DateComponent  {
  /* selectedDate: Date | null = null;
   selectedStartHour: number | null = null;
   selectedDuration: number | null = null;
   timeSlots: { startHour: number; isBooked: boolean }[] = [
     { startHour: 7, isBooked: false },
     { startHour: 8, isBooked: false },
     { startHour: 9, isBooked: false },
     { startHour: 10, isBooked: false },
     { startHour: 11, isBooked: false },
     { startHour: 12, isBooked: false },
     { startHour: 13, isBooked: false },
     { startHour: 14, isBooked: false },
     { startHour: 15, isBooked: false },
     { startHour: 16, isBooked: false },
     { startHour: 17, isBooked: false },
     { startHour: 18, isBooked: false },
     { startHour: 19, isBooked: false },
     { startHour: 20, isBooked: false },
     { startHour: 21, isBooked: false },
     { startHour: 22, isBooked: false },
     { startHour: 23, isBooked: false },
     { startHour: 24, isBooked: false },
     { startHour: 25, isBooked: false }
   ];
   availableDurations: { value: number; isBlocked: boolean }[] = [
     { value: 1, isBlocked: false },
     { value: 2, isBlocked: false },
     { value: 3, isBlocked: false },
     { value: 4, isBlocked: false },
     { value: 5, isBlocked: false },
     { value: 6, isBlocked: false }
   ];

   @Output() appointmentChange = new EventEmitter<{
     date: Date | null;
     startHour: number | null;
     duration: number | null;
   }>();

   private subscription: Subscription | null = null;

   constructor(private usersService: UsersService) {}

   ngOnInit() {
     this.subscription = this.usersService.futureUsers$.subscribe((bookings: AppointmentDetails[]) => {
       this.updateTimeSlotAvailability(bookings);
       this.updateAvailableDurations(bookings);
     });
   }

   ngOnDestroy() {
     if (this.subscription) {
       this.subscription.unsubscribe();
     }
   }

   onDateChange() {
     if (this.selectedDate) {
       const bookings = this.usersService.userSubject.getValue();
       this.updateTimeSlotAvailability(bookings);
       this.updateAvailableDurations(bookings);
       this.updateTime();
     }
     this.emitAppointment();
   }

   updateTimeSlotAvailability(bookings: AppointmentDetails[]) {
     if (!this.selectedDate) {
       this.timeSlots.forEach(slot => (slot.isBooked = false));
       return;
     }

     const selectedDateStart = new Date(this.selectedDate);
     selectedDateStart.setHours(0, 0, 0, 0);

     this.timeSlots.forEach(slot => (slot.isBooked = false));

     bookings.forEach(booking => {
       const bookingDate = new Date(booking.appointmentDate);
       bookingDate.setHours(0, 0, 0, 0);

       if (bookingDate.getTime() === selectedDateStart.getTime()) {
         const bookingStartHour = booking.appointmentStartHour % 24;
         const bookingEndHour = (booking.appointmentStartHour + booking.appointmentDuration) % 24;
         const bookingEndDayOffset = Math.floor((booking.appointmentStartHour + booking.appointmentDuration) / 24);

         this.timeSlots.forEach(slot => {
           const slotStartHour = slot.startHour % 24;
           const slotDayOffset = Math.floor(slot.startHour / 24);

           if (slotDayOffset === bookingEndDayOffset || slotDayOffset === 0) {
             if (
               (slotStartHour >= bookingStartHour && slotStartHour < bookingEndHour) ||
               (bookingEndHour < bookingStartHour && slotStartHour < bookingEndHour) ||
               (slotStartHour >= bookingStartHour && bookingEndHour < bookingStartHour)
             ) {
               slot.isBooked = true;
             }
           }
         });
       }
     });
   }

   updateAvailableDurations(bookings: AppointmentDetails[]) {
     if (!this.selectedDate || this.selectedStartHour === null) {
       this.availableDurations.forEach(duration => (duration.isBlocked = false));
       return;
     }

     const selectedDateStart = new Date(this.selectedDate);
     selectedDateStart.setHours(0, 0, 0, 0);
     const adjustedStartHour = this.selectedStartHour % 24;
     const startTime = new Date(this.selectedDate);
     startTime.setHours(adjustedStartHour, 0, 0, 0);

     this.availableDurations.forEach(duration => {
       duration.isBlocked = false;
       const endHour = (this.selectedStartHour! + duration.value) % 24;
       const endDayOffset = Math.floor((this.selectedStartHour! + duration.value) / 24);
       const endTime = new Date(this.selectedDate!);
       endTime.setDate(endTime.getDate() + endDayOffset);
       endTime.setHours(endHour, 0, 0, 0);

       bookings.forEach(booking => {
         const bookingDate = new Date(booking.appointmentDate);
         bookingDate.setHours(0, 0, 0, 0);

         if (bookingDate.getTime() === selectedDateStart.getTime()) {
           const bookingStartHour = booking.appointmentStartHour % 24;
           const bookingStartTime = new Date(booking.appointmentDate);
           bookingStartTime.setHours(bookingStartHour, 0, 0, 0);

           const bookingEndHour = (booking.appointmentStartHour + booking.appointmentDuration) % 24;
           const bookingEndDayOffset = Math.floor(
             (booking.appointmentStartHour + booking.appointmentDuration) / 24
           );
           const bookingEndTime = new Date(booking.appointmentDate);
           bookingEndTime.setDate(bookingEndTime.getDate() + bookingEndDayOffset);
           bookingEndTime.setHours(bookingEndHour, 0, 0, 0);

           if (
             (startTime < bookingEndTime && endTime > bookingStartTime) ||
             (startTime <= bookingStartTime && endTime >= bookingEndTime)
           ) {
             duration.isBlocked = true;
           }
         }
       });
     });
   }

   updateTime() {
     if (this.selectedDate && this.selectedStartHour !== null && this.selectedDuration !== null) {
       const updatedDate = new Date(this.selectedDate);
       const dayOffset = Math.floor(this.selectedStartHour / 24);
       const adjustedHour = this.selectedStartHour % 24;
       updatedDate.setDate(updatedDate.getDate() + dayOffset);
       updatedDate.setHours(adjustedHour, 0, 0, 0);
       this.selectedDate = updatedDate;
       const bookings = this.usersService.userSubject.getValue();
       this.updateAvailableDurations(bookings);
       this.emitAppointment();
     }
   }

   formatTime(hour: number): string {
     const adjustedHour = hour % 24;
     const date = new Date();
     date.setHours(adjustedHour, 0, 0, 0);
     return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
   }

   formatSelectedDateTime(): string {
     if (!this.selectedDate || this.selectedStartHour === null || this.selectedDuration === null) return '';

     const startDate = new Date(this.selectedDate);
     const startHour = this.selectedStartHour % 24;
     startDate.setHours(startHour, 0, 0, 0);

     const endDate = new Date(this.selectedDate);
     const endHour = (this.selectedStartHour + this.selectedDuration) % 24;
     const endDayOffset = Math.floor((this.selectedStartHour + this.selectedDuration) / 24);
     endDate.setDate(endDate.getDate() + endDayOffset);
     endDate.setHours(endHour, 0, 0, 0);

     const timeString =
       startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) +
       ' - ' +
       endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
     const dateString = startDate.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });

     return `${timeString}, ${dateString}`;
   }

   private emitAppointment() {
     this.appointmentChange.emit({
       date: this.selectedDate,
       startHour: this.selectedStartHour,
       duration: this.selectedDuration
     });
   }
 }
 */
}
