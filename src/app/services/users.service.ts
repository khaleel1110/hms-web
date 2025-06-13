import { inject, Injectable, DestroyRef } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject, map, Observable, interval } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Timestamp } from 'firebase/firestore';

export interface Status {
  value: 'Completed' | 'In Progress' | 'Scheduled';
}

export interface AppointmentDetails {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  appointmentDate: string;
  startTime: Date;
  endTime: Date;
  bookingId: string;
  createdAt: Date;
}

export interface UserDisplay {
  id: string;
  fullName: string;
  email: string;
  department: string;
  status: Status['value'];
  role: string;
  phone?: string;
  appointmentDetails: AppointmentDetails;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading = toSignal(this.isLoadingSubject.asObservable(), { initialValue: true });

  userSubject = new BehaviorSubject<UserDisplay[]>([]);
  users$ = this.userSubject.asObservable();

  todayUsers$: Observable<UserDisplay[]> = this.users$.pipe(
    map((users) =>
      users.filter((user) => {
        try {
          const appointmentDate = new Date(user.appointmentDetails.appointmentDate);
          if (isNaN(appointmentDate.getTime())) return false;
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];
          const appointmentDateString = appointmentDate.toISOString().split('T')[0];
          return appointmentDateString === todayString;
        } catch {
          return false;
        }
      })
    )
  );

  futureUsers$: Observable<UserDisplay[]> = this.users$.pipe(
    map((users) =>
      users.filter((user) => {
        try {
          const appointmentDate = new Date(user.appointmentDetails.appointmentDate);
          if (isNaN(appointmentDate.getTime())) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return appointmentDate >= today;
        } catch {
          return false;
        }
      })
    )
  );

  constructor() {
    const userCollection = collection(this.firestore, 'bookings');

    const subscription = collectionData(userCollection, { idField: 'id' })
      .pipe(
        map((data: any[]) =>
          data.map((item) => {
            const appointmentDetails: AppointmentDetails = {
              id: item.id,
              patientName: item.patientName || '',
              email: item.email || 'N/A',
              phone: item.phone || '',
              departmentName: item.departmentName || 'Unknown',
              doctorId: item.doctorId || '',
              doctorName: item.doctorName || 'Unknown',
              appointmentType: item.appointmentType || 'Unknown',
              appointmentDate: item.appointmentDate || '',
              startTime: item.startTime instanceof Timestamp
                ? item.startTime.toDate()
                : new Date(item.startTime),
              endTime: item.endTime instanceof Timestamp
                ? item.endTime.toDate()
                : new Date(item.endTime),
              bookingId: item.bookingId || '',
              createdAt: item.createdAt instanceof Timestamp
                ? item.createdAt.toDate()
                : new Date(item.createdAt)
            };

            const status = this.calculateStatus(appointmentDetails);

            return {
              id: item.id,
              fullName: item.patientName || 'Unknown',
              email: item.email || 'N/A',
              department: item.departmentName || 'Unknown',
              status,
              role: 'Patient',
              phone: item.phone,
              appointmentDetails
            } as UserDisplay;
          })
        )
      )
      .subscribe({
        next: (users: UserDisplay[]) => {
          this.userSubject.next(users);
          this.isLoadingSubject.next(false);
        },
        error: (error: any) => {
          console.error('Error fetching bookings:', error);
          this.userSubject.next([]);
          this.isLoadingSubject.next(false);
        },
      });

    const statusUpdateSubscription = interval(60000).subscribe(() => {
      const currentUsers = this.userSubject.getValue();
      const updatedUsers = currentUsers.map((user) => ({
        ...user,
        status: this.calculateStatus(user.appointmentDetails),
      }));
      this.userSubject.next(updatedUsers);
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      statusUpdateSubscription.unsubscribe();
    });
  }

  private calculateStatus(details: AppointmentDetails): Status['value'] {
    const now = new Date();
    const startTime = new Date(details.startTime);
    const endTime = new Date(details.endTime);

    if (now > endTime) {
      return 'Completed';
    } else if (now >= startTime && now <= endTime) {
      return 'In Progress';
    } else {
      return 'Scheduled';
    }
  }
}
