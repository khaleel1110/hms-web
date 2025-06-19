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
import { firstValueFrom } from 'rxjs';
import { TimePickerDialogComponent } from '../date-picker/time-picker-dialog/time-picker-dialog.component';
import { BookingService, Patient, Doctor } from '../../services/booking.service';

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
  @Output() bookingSubmitted = new EventEmitter<Patient>();
  @Input() initialDate: Date | null = null;
  @ViewChild('bookingForm') bookingForm!: NgForm;

  selectedDate: Date | null = null;
  selectedDateTimeRange: { start: Date; end: Date } | null = null;
  selectedDuration: number = 30;
  bookingError: string | null = null;
  isLoading = false;
  doctors: Doctor[] = [];
  departmentId: string = '';

  patient: Patient = {
    id: '',
    name: '',
    email: '',
    phone: '',
    dob: null,
    departmentId: '',
    doctorId: '',
    doctorName: '',
    appointmentType: '',
    startTime: null,
    endTime: null,
    createdAt: new Date()
  };

  constructor(
    private dialog: MatDialog,
    private bookingService: BookingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.departmentId = params.get('id') || '';
      this.patient.departmentId = this.departmentId;
      if (this.departmentId) {
        this.loadDoctors();
      } else {
        this.bookingError = 'No department selected. Please choose a department.';
      }
    });

    if (this.initialDate) {
      this.selectedDate = this.initialDate;
      this.setInitialDateTime(this.initialDate);
    }
  }

  private loadDoctors() {
    this.isLoading = true;
    this.bookingService.getDoctorsByDepartment(this.departmentId).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.isLoading = false;
        if (doctors.length === 0) {
          this.bookingError = 'No doctors available in this department.';
        } else {
          this.bookingError = null;
        }
      },
      error: (err) => {
        console.error('Error fetching doctors:', err);
        this.isLoading = false;
        this.bookingError = 'Unable to load doctors. Please try again later or contact support.';
        this.doctors = [];
      }
    });
  }

  setInitialDateTime(date: Date) {
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + this.selectedDuration);
    this.selectedDateTimeRange = { start: date, end: endDate };
    this.patient.startTime = date;
    this.patient.endTime = endDate;
  }

  onDatePickerChange(date: Date | null): void {
    if (date) {
      this.selectedDate = date;
      this.openTimePicker(date);
    } else {
      this.selectedDate = null;
      this.selectedDateTimeRange = null;
      this.patient.startTime = null;
      this.patient.endTime = null;
      this.bookingError = null;
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
        this.patient.startTime = this.selectedDateTimeRange.start;
        this.patient.endTime = this.selectedDateTimeRange.end;
        if (this.patient.doctorId) {
          this.checkAvailability();
        }
      } else {
        this.selectedDateTimeRange = null;
        this.patient.startTime = null;
        this.patient.endTime = null;
        this.bookingError = null;
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
    const selectedDoctor = this.doctors.find(doctor => doctor.id === this.patient.doctorId);
    this.patient.doctorName = selectedDoctor ? selectedDoctor.name : '';
    if (this.selectedDateTimeRange && this.patient.doctorId) {
      this.checkAvailability();
    }
  }

  private async checkAvailability() {
    if (!this.selectedDateTimeRange || !this.patient.doctorId) {
      this.bookingError = 'Please select a doctor and a time slot.';
      this.isLoading = false;
      return false;
    }

    this.isLoading = true;
    this.bookingError = null;

    const availabilityData = {
      doctorId: this.patient.doctorId,
      startTime: this.selectedDateTimeRange.start,
      endTime: this.selectedDateTimeRange.end
    };

    try {
      const available = await firstValueFrom(this.bookingService.checkAvailability(availabilityData));
      this.isLoading = false;
      if (!available) {
        this.bookingError = 'This time slot is already booked. Please choose another time.';
        return false;
      }
      return true;
    } catch (error) {
      this.isLoading = false;
      this.bookingError = (error instanceof Error) ? error.message : 'Failed to check availability. Please try again.';
      return false;
    }
  }

/*  async onSubmit() {
    if (!this.bookingForm.valid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.controls[key].markAsTouched();
      });
      this.bookingError = 'Please fill in all required fields: ' +
        Object.keys(this.bookingForm.controls)
          .filter(key => this.bookingForm.controls[key].invalid)
          .join(', ');
      return;
    }

    if (!this.patient.name || !this.patient.email || !this.patient.phone || !this.patient.dob || !this.patient.appointmentType) {
      this.bookingError = 'Please ensure name, email, phone, date of birth, and appointment type are provided.';
      return;
    }

    if (!this.selectedDateTimeRange || !this.patient.doctorId) {
      this.bookingError = 'Please select a doctor and a valid time slot.';
      return;
    }

    this.isLoading = true;
    this.bookingError = null;

    // Check availability before submitting
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      this.isLoading = false;
      return;
    }

    try {
      const patientData: Omit<Patient, 'id' | 'createdAt'> = {
        name: this.patient.name,
        email: this.patient.email,
        phone: this.patient.phone,
        dob: this.patient.dob,
        departmentId: this.patient.departmentId,
        doctorId: this.patient.doctorId,
        doctorName: this.patient.doctorName,
        appointmentType: this.patient.appointmentType,
        startTime: this.patient.startTime,
        endTime: this.patient.endTime
      };

      const response = await firstValueFrom(this.bookingService.addPatient(patientData));

      this.isLoading = false;
      this.bookingSubmitted.emit(response);
      alert('Appointment booked successfully! A confirmation email has been sent.');
      this.resetForm();
    } catch (error) {
      this.isLoading = false;
      this.bookingError = 'Failed to book appointment: ' + ((error instanceof Error) ? error.message : 'Please try again.');
    }
  }*/

  private resetForm() {
    this.patient = {
      id: '',
      name: '',
      email: '',
      phone: '',
      dob: null,
      departmentId: this.departmentId,
      doctorId: '',
      doctorName: '',
      appointmentType: '',
      startTime: null,
      endTime: null,
      createdAt: new Date()
    };
    this.selectedDate = null;
    this.selectedDateTimeRange = null;
    this.bookingError = null;
    if (this.bookingForm) {
      this.bookingForm.resetForm();
    }
  }
/*
  onSubmit() {
    if (!this.bookingForm.valid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.controls[key].markAsTouched();
      });
      alert('Please fix the form errors before submitting.');
      return;
    }

    if (!this.selectedDateTimeRange || !this.patient.doctorId || this.bookingError) {
      alert('Please select a valid date, time, and doctor.');
      return;
    }

    this.isLoading = true;
    const selectedDoctor = this.doctors.find(doctor => doctor.id === this.patient.doctorId);
    const bookingData = {
      patientName: this.patient.name,
      email: this.patient.email,
      phone: this.patient.phone,
      departmentName: this.departmentId || 'Unknown Department',
      doctorId: this.patient.doctorId,
      doctorName: selectedDoctor ? selectedDoctor.name : 'Unknown Doctor',
      appointmentType: this.patient.appointmentType,
      appointmentDate: this.selectedDateTimeRange.start.toISOString().split('T')[0],
      startTime: this.selectedDateTimeRange.start,
      endTime: this.selectedDateTimeRange.end,
      bookingId: `BK-${Date.now()}`
    };

    this.bookingService.submitBooking(bookingData).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert('Appointment booked successfully! A confirmation has been sent to your email.');
        this.bookingForm.reset(); // Optional: Reset form after successful booking
      },
      error: (error) => {
        this.isLoading = false;
        alert('Failed to book appointment: ' + (error.message || 'Please try again.'));
      }
    });
  }
*/

  async onSubmit() {
    if (!this.bookingForm.valid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.controls[key].markAsTouched();
      });
      alert('Please fix the form errors before submitting.');
      return;
    }

    if (!this.selectedDateTimeRange || !this.patient.doctorId || this.bookingError) {
      alert('Please select a valid date, time, and doctor.');
      return;
    }

    this.isLoading = true;
    this.bookingError = null;

    const selectedDoctor = this.doctors.find(d => d.id === this.patient.doctorId);
    this.patient.doctorName = selectedDoctor ? selectedDoctor.name : 'Unknown Doctor';
    this.patient.startTime = this.selectedDateTimeRange.start;
    this.patient.endTime = this.selectedDateTimeRange.end;

    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      this.isLoading = false;
      return;
    }

    try {
      const patientData: Omit<Patient, 'id' | 'createdAt'> = {
        name: this.patient.name,
        email: this.patient.email,
        phone: this.patient.phone,
        dob: this.patient.dob,
        departmentId: this.patient.departmentId,
        doctorId: this.patient.doctorId,
        doctorName: this.patient.doctorName,
        appointmentType: this.patient.appointmentType,
        startTime: this.patient.startTime,
        endTime: this.patient.endTime
      };

      const response = await firstValueFrom(this.bookingService.addPatient(patientData));

      this.isLoading = false;
      alert('Appointment booked successfully! A confirmation email has been sent.');
      this.bookingSubmitted.emit(response);
      this.resetForm();
    } catch (error) {
      this.isLoading = false;
      const errorMsg = (error instanceof Error) ? error.message : 'Please try again.';
      this.bookingError = 'Failed to book appointment: ' + errorMsg;
      alert(this.bookingError);
    }
  }



}
