import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { TimePickerDialogComponent } from '../date-picker/time-picker-dialog/time-picker-dialog.component';
import {BookingService} from '../../services/booking.service';

@Component({
  selector: 'app-doctor-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './doctor-booking.component.html',
  styleUrls: ['./doctor-booking.component.scss']
})
export class DoctorBookingComponent implements OnInit {
  @Output() bookingSubmitted = new EventEmitter<any>();
  @Input() initialDate: Date | null = null;
  @ViewChild('bookingForm') bookingForm!: NgForm;

  selectedDate: Date | null = null;
  selectedDateTimeRange: { start: Date; end: Date } | null = null;
  selectedDuration: number = 30;
  departmentId: string | null = null;
  bookingError: string | null = null;
  isLoading = false;

  booking = {
    patientName: '',
    email: '',
    phone: '',
    doctorId: '',
    appointmentType: '',
    startTime: null as Date | null,
    endTime: null as Date | null,
    departmentId: ''
  };

  doctors = [
    { id: '1', name: 'Dr. John Smith', specialty: 'Cardiology', departmentId: 'cardiology' },
    { id: '2', name: 'Dr. Sarah Johnson', specialty: 'Pediatrics', departmentId: 'pediatrics' },
    { id: '3', name: 'Dr. Michael Chen', specialty: 'Neurology', departmentId: 'neurology' },
    { id: '4', name: 'Dr. Emily Davis', specialty: 'Physiotherapy', departmentId: 'physiotherapy' },
    { id: '5', name: 'Dr. Robert Wilson', specialty: 'Orthopedics', departmentId: 'orthopedics' },
    { id: '6', name: 'Dr. Linda Brown', specialty: 'Radiology', departmentId: 'radiology' },
    { id: '7', name: 'Dr. James Lee', specialty: 'Oncology', departmentId: 'oncology' },
    { id: '8', name: 'Dr. Patricia Taylor', specialty: 'Endocrinology', departmentId: 'endocrinology' }
  ];

  filteredDoctors: typeof this.doctors = [];

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.departmentId = this.route.snapshot.paramMap.get('id');
    this.booking.departmentId = this.departmentId || '';
    this.filteredDoctors = this.departmentId
      ? this.doctors.filter(doctor => doctor.departmentId === this.departmentId)
      : this.doctors;

    if (this.initialDate) {
      this.selectedDate = this.initialDate;
      this.setInitialDateTime(this.initialDate);
    }
  }

  setInitialDateTime(date: Date) {
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + this.selectedDuration);
    this.selectedDateTimeRange = {
      start: date,
      end: endDate
    };
    this.booking.startTime = date;
    this.booking.endTime = endDate;
  }

  onDatePickerChange(date: Date | null): void {
    if (date) {
      this.selectedDate = date;
      this.openTimePicker(date);
    } else {
      this.selectedDate = null;
      this.selectedDateTimeRange = null;
      this.booking.startTime = null;
      this.booking.endTime = null;
    }
  }

  openTimePicker(date: Date) {
    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      width: '400px',
      data: { date: date, maxDuration: this.selectedDuration }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedDuration = result.duration;
        this.selectedDateTimeRange = {
          start: this.combineDateAndTime(result.date, result.timeRange.start),
          end: this.combineDateAndTime(result.date, result.timeRange.end)
        };
        this.booking.startTime = this.selectedDateTimeRange.start;
        this.booking.endTime = this.selectedDateTimeRange.end;
        this.checkAvailability();
      } else {
        this.selectedDateTimeRange = null;
        this.booking.startTime = null;
        this.booking.endTime = null;
      }
    });
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  getDateTimeRangeDisplay(): string {
    if (!this.selectedDateTimeRange) return '';
    return `${this.selectedDateTimeRange.start.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })} - ${this.selectedDateTimeRange.end.toLocaleTimeString('en-US', { timeStyle: 'short' })}`;
  }

  onDoctorChange() {
    this.bookingError = null;
    if (this.selectedDateTimeRange) {
      this.checkAvailability();
    }
  }

  private checkAvailability() {
    if (this.selectedDateTimeRange && this.booking.doctorId) {
      this.isLoading = true;
      this.bookingError = null;

      const availabilityData = {
        doctorId: this.booking.doctorId,
        startTime: this.selectedDateTimeRange.start,
        endTime: this.selectedDateTimeRange.end
      };

      this.bookingService.checkAvailability(availabilityData).subscribe({
        next: (available) => {
          this.isLoading = false;
          if (available) {
            this.bookingError = null;
          } else {
            this.bookingError = 'This time slot is already booked. Please choose another time.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.bookingError = error.message || 'Failed to check availability. Please try again.';
        }
      });
    }
  }

  onSubmit() {
    if (!this.bookingForm.valid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.controls[key].markAsTouched();
      });
      alert('Please fix the form errors before submitting.');
      return;
    }

    if (!this.selectedDateTimeRange || !this.booking.doctorId || this.bookingError) {
      alert('Please select a valid date, time, and doctor.');
      return;
    }

    this.isLoading = true;
    const selectedDoctor = this.doctors.find(doctor => doctor.id === this.booking.doctorId);
    const bookingData = {
      patientName: this.booking.patientName,
      email: this.booking.email,
      phone: this.booking.phone,
      departmentName: this.departmentId || 'Unknown Department',
      doctorId: this.booking.doctorId,
      doctorName: selectedDoctor ? selectedDoctor.name : 'Unknown Doctor',
      appointmentType: this.booking.appointmentType,
      appointmentDate: this.selectedDateTimeRange.start.toISOString().split('T')[0],
      startTime: this.selectedDateTimeRange.start,
      endTime: this.selectedDateTimeRange.end,
      bookingId: `BK-${Date.now()}`
    };

    this.bookingService.submitBooking(bookingData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.bookingSubmitted.emit(bookingData);
        alert('Appointment booked successfully! A confirmation email has been sent.');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        alert('Failed to book appointment: ' + (error.message || 'Please try again.'));
      }
    });
  }

  private resetForm() {
    this.booking = {
      patientName: '',
      email: '',
      phone: '',
      doctorId: '',
      appointmentType: '',
      startTime: null,
      endTime: null,
      departmentId: this.departmentId || ''
    };
    this.selectedDate = null;
    this.selectedDateTimeRange = null;
    this.bookingError = null;
    this.bookingForm.resetForm();
  }
}
