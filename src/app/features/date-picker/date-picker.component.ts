import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TimePickerDialogComponent } from './time-picker-dialog/time-picker-dialog.component';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCard
  ],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'] // fixed typo: styleUrl → styleUrls
})
export class DatePickerComponent implements OnInit {
  @Output() dateTimeSelected = new EventEmitter<{ start: Date, end: Date, duration?: number }>();
  @Input() initialDate: Date | null = null;

  selectedDateTimeRange: { start: Date, end: Date } | null = null;
  selectedDuration: number | null = null;

  ngOnInit(): void {
    if (this.initialDate) {
      const endDate = new Date(this.initialDate);
      endDate.setHours(endDate.getHours() + 1);
      this.selectedDateTimeRange = {
        start: this.initialDate,
        end: endDate
      };
    }
  }

  constructor(private dialog: MatDialog) {}

  openTimePicker() {
    const initialDate = this.selectedDateTimeRange?.start || this.initialDate || new Date();
    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      width: '400px',
      data: { date: initialDate }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedDuration = result.duration;
        this.selectedDateTimeRange = {
          start: this.combineDateAndTime(result.date, result.timeRange.start),
          end: this.combineDateAndTime(result.date, result.timeRange.end)
        };
        this.emitDateTime();
      }
    });
  }

  private emitDateTime() {
    if (this.selectedDateTimeRange) {
      this.dateTimeSelected.emit({
        start: this.selectedDateTimeRange.start,
        end: this.selectedDateTimeRange.end,
        duration: this.selectedDuration || undefined
      });
    }
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  getDateTimeRangeDisplay(): string {
    if (!this.selectedDateTimeRange) return '';
    return `${this.selectedDateTimeRange.start.toLocaleString()} - ${this.selectedDateTimeRange.end.toLocaleTimeString()}`;
  }
}
