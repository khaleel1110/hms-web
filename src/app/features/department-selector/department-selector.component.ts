import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelectModule, MatOption } from '@angular/material/select';

import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {BookingService, Doctor} from '../../services/booking.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-department-selector',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatLabel,
    MatSelectModule,
    MatOption,
    NgForOf,
    NgIf,
    FormsModule
  ],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Department</mat-label>
        <mat-select
          [(ngModel)]="selectedDepartmentId"
          (ngModelChange)="onDepartmentChange()"
          required
        >
          <mat-option *ngFor="let department of departments()" [value]="department.id">
            {{ department.name }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="!selectedDepartmentId">Department is required</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Doctor</mat-label>
        <mat-select
          [(ngModel)]="selectedDoctorName"
          (ngModelChange)="onDoctorChange($event)"
          required
          [disabled]="!selectedDepartmentId || doctors.length === 0"
        >
          <mat-option *ngFor="let doctor of doctors" [value]="doctor.name">
            {{ doctor.name }} ({{ doctor.specialty }})
          </mat-option>
          <mat-option *ngIf="doctors.length === 0" disabled>No doctors available</mat-option>
        </mat-select>
        <mat-error *ngIf="!selectedDoctorName && selectedDepartmentId">Doctor is required</mat-error>
      </mat-form-field>
    </div>
  `
})
export class DepartmentSelectorComponent {
  @Input() selectedDepartmentId: string = '';
  @Output() selectedDepartmentIdChange = new EventEmitter<string>();

  @Input() selectedDoctorName: string = '';
  @Output() selectedDoctorNameChange = new EventEmitter<string>();

  @Output() selectionChange = new EventEmitter<void>();
  @Output() doctorChange = new EventEmitter<string>();

  private bookingService = inject(BookingService);
  departments = toSignal(this.bookingService.departments$, { initialValue: [] });
  doctors: Doctor[] = [];

  onDepartmentChange() {
    this.selectedDoctorName = '';
    this.selectedDepartmentIdChange.emit(this.selectedDepartmentId);
    this.selectedDoctorNameChange.emit(this.selectedDoctorName);
    this.selectionChange.emit();

    if (this.selectedDepartmentId) {
      this.bookingService.getDoctorsByDepartment(this.selectedDepartmentId).subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          if (doctors.length === 0) {
            this.selectedDoctorName = '';
            this.selectedDoctorNameChange.emit('');
          }
        },
        error: (err) => {
          console.error('Error fetching doctors:', err);
          this.doctors = [];
          this.selectedDoctorName = '';
          this.selectedDoctorNameChange.emit('');
        }
      });
    } else {
      this.doctors = [];
    }
  }

  onDoctorChange(name: string) {
    this.selectedDoctorName = name;
    this.selectedDoctorNameChange.emit(name);
    this.doctorChange.emit(name);
  }
}
