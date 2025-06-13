import {DestroyRef, inject, Injectable} from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private bookingsCollection = collection(this.firestore, 'bookings');

  checkAvailability(data: { doctorId: string; startTime: Date; endTime: Date }): Observable<boolean> {
    const { doctorId, startTime, endTime } = data;
    const q = query(
      this.bookingsCollection,
      where('doctorId', '==', doctorId),
      where('startTime', '<', endTime),
      where('endTime', '>', startTime)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.empty)
    );
  }

  submitBooking(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/send-booking-email`, data);
  }
}
