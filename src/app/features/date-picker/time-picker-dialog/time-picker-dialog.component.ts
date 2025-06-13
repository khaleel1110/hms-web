import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-time-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Select Appointment Time</h2>
    <div mat-dialog-content>
      <div class="time-range-container">
        <mat-form-field appearance="fill">
          <mat-label>Start Time</mat-label>
          <mat-select [(ngModel)]="selectedTime" (selectionChange)="setEndTime()" required>
            <mat-option *ngFor="let time of availableTimes" [value]="time">
              {{ time | date:'shortTime' }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="!selectedTime">Start time is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Duration</mat-label>
          <mat-select [(ngModel)]="selectedDuration" (selectionChange)="setEndTime()" required>
            <mat-option *ngFor="let duration of availableDurations" [value]="duration">
              {{ duration }} minutes
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div *ngIf="timeRange.end" class="time-info">
        <p><strong>End Time:</strong> {{ timeRange.end | date:'shortTime' }}</p>
      </div>
    </div>
    <div mat-dialog-actions>
      <button mat-button type="button" (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!isTimeValid()">Save</button>
    </div>
  `,
  styles: [`
    .time-range-container {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .time-info {
      margin-top: 8px;
      color: #666;
    }
    mat-form-field {
      flex: 1;
    }
  `]
})
export class TimePickerDialogComponent {
  selectedTime: Date | null = null;
  selectedDuration: number;
  availableTimes: Date[] = [];
  availableDurations: number[] = [15, 30, 45, 60];
  timeRange = {
    start: null as Date | null,
    end: null as Date | null
  };

  constructor(
    public dialogRef: MatDialogRef<TimePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { date: Date; maxDuration: number }
  ) {
    this.selectedDuration = this.data.maxDuration || 30;
    this.initializeTimes();
  }

  private initializeTimes(): void {
    const startDate = new Date(this.data.date);
    startDate.setHours(8, 0, 0, 0); // Start at 8:00 AM
    const endDate = new Date(this.data.date);
    endDate.setHours(17, 0, 0, 0); // End at 5:00 PM

    // Generate time slots every 15 minutes
    while (startDate <= endDate) {
      this.availableTimes.push(new Date(startDate));
      startDate.setMinutes(startDate.getMinutes() + 15);
    }

    // Set default time to next available slot
    const now = new Date();
    const currentDate = new Date(this.data.date);
    const nearestTime = this.availableTimes.find(time =>
      time >= now &&
      time.getDate() === currentDate.getDate()
    ) || this.availableTimes[0];

    this.selectedTime = nearestTime;
    this.setEndTime();
  }

  setEndTime(): void {
    if (!this.selectedTime) {
      this.timeRange = { start: null, end: null };
      return;
    }

    this.timeRange.start = new Date(this.selectedTime);
    const endDate = new Date(this.selectedTime.getTime() + this.selectedDuration * 60 * 1000);
    this.timeRange.end = endDate;
  }

  isTimeValid(): boolean {
    return !!this.selectedTime && !!this.timeRange.start && !!this.timeRange.end;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isTimeValid()) {
      this.dialogRef.close({
        date: this.data.date,
        timeRange: {
          start: this.formatTime(this.timeRange.start!),
          end: this.formatTime(this.timeRange.end!)
        },
        duration: this.selectedDuration
      });
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
