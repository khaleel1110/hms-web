import { inject, Injectable } from '@angular/core';
import {
  Firestore, collection, doc, getDoc,
  collectionData, addDoc, query, where, getDocs
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Auth, signInAnonymously, onAuthStateChanged } from '@angular/fire/auth';
import { Observable, from, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, take, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: Date | null;
  departmentId: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  description: string;
  departmentId: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  photoUrl: string;
  doctors: Doctor[];
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private refreshDepartments$ = new BehaviorSubject<void>(undefined);

  departments$: Observable<Department[]> = combineLatest([this.refreshDepartments$]).pipe(
    switchMap(() => new Observable<Department[]>(observer => {
      this.ensureAuthenticated().then(user => {
        if (user) {
          collectionData(collection(this.firestore, 'departments'), { idField: 'id' })
            .pipe(
              map(departments => departments as Department[]),
              catchError(err => {
                console.error('Error fetching departments:', err);
                observer.error(err);
                throw err;
              })
            )
            .subscribe({
              next: departments => observer.next(departments),
              error: err => observer.error(err)
            });
        } else {
          observer.error(new Error('User not authenticated'));
        }
      }).catch(err => observer.error(err));
    }))
  );

  constructor() {
    this.ensureAuthenticated().then(() => this.refreshDepartments$.next())
      .catch(error => console.error('Initial auth error:', error));
  }

  private async ensureAuthenticated(): Promise<any> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, user => {
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(this.auth)
            .then(userCredential => resolve(userCredential.user))
            .catch(error => {
              console.error('Anonymous sign-in failed:', error);
              reject(error);
            });
        }
      }, reject);
    });
  }

  refreshData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ensureAuthenticated().then(user => {
        if (user) {
          this.refreshDepartments$.next();
          this.departments$.pipe(take(1)).subscribe({
            next: () => resolve(),
            error: err => reject(err)
          });
        } else {
          reject(new Error('User not authenticated'));
        }
      }).catch(err => reject(err));
    });
  }

  addPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Observable<Patient> {
    return new Observable<Patient>(observer => {
      this.ensureAuthenticated().then(user => {
        if (user) {
          const patientData: Patient = {
            ...patient,
            id: this.generateId('PT'),
            createdAt: new Date()
          };
          from(addDoc(collection(this.firestore, 'patients'), patientData)).pipe(
            tap(() => {
              this.sendConfirmationEmail(patientData).subscribe({
                next: () => console.log('Confirmation email sent successfully'),
                error: (err) => console.error('Failed to send email:', err)
              });
            }),
            map(() => patientData),
            catchError(err => {
              console.error('Error adding patient:', err);
              observer.error(err);
              throw err;
            })
          ).subscribe({
            next: patient => observer.next(patient),
            error: err => observer.error(err)
          });
        } else {
          observer.error(new Error('User not authenticated'));
        }
      }).catch(err => observer.error(err));
    });
  }

  private sendConfirmationEmail(patient: Patient): Observable<any> {
    const emailData = {
      patientName: patient.name,
      email: patient.email,
      phone: patient.phone,
      departmentName: patient.departmentId,
      doctorId: patient.doctorId,
      doctorName: patient.doctorName,
      appointmentType: patient.appointmentType,
      appointmentDate: patient.startTime?.toISOString().split('T')[0],
      startTime: patient.startTime?.toISOString(), // ✅ Fixed format
      endTime: patient.endTime?.toISOString(),     // ✅ Fixed format
      bookingId: patient.id
    };

    return this.http.post(`${environment.apiUrl}/send-booking-email`, emailData).pipe(
      catchError(err => {
        console.error('Email sending failed:', err);
        throw err;
      })
    );
  }

  getDoctorsByDepartment(departmentId: string): Observable<Doctor[]> {
    return new Observable<Doctor[]>(observer => {
      this.ensureAuthenticated().then(user => {
        if (user) {
          const departmentRef = doc(this.firestore, 'departments', departmentId);
          from(getDoc(departmentRef)).pipe(
            map(docSnapshot => {
              if (docSnapshot.exists()) {
                const department = docSnapshot.data() as Department;
                return (department.doctors || []).map(doctor => ({
                  ...doctor,
                  id: doctor.id || this.generateId('DR'),
                  departmentId
                }));
              } else {
                return [];
              }
            }),
            catchError(err => {
              console.error('Error fetching doctors:', err);
              observer.error(err);
              throw err;
            })
          ).subscribe({
            next: doctors => observer.next(doctors),
            error: err => observer.error(err)
          });
        } else {
          observer.error(new Error('User not authenticated'));
        }
      }).catch(err => observer.error(err));
    });
  }

  checkAvailability(data: { doctorId: string; startTime: Date; endTime: Date }): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.ensureAuthenticated().then(user => {
        if (user) {
          const patientsCollection = collection(this.firestore, 'patients');
          const q = query(
            patientsCollection,
            where('doctorId', '==', data.doctorId),
            where('startTime', '<', data.endTime),
            where('endTime', '>', data.startTime)
          );
          from(getDocs(q)).pipe(
            map(snapshot => snapshot.empty),
            catchError(err => {
              console.error('Error checking availability:', err);
              observer.error(err);
              throw err;
            })
          ).subscribe({
            next: isAvailable => observer.next(isAvailable),
            error: err => observer.error(err)
          });
        } else {
          observer.error(new Error('User not authenticated'));
        }
      }).catch(err => observer.error(err));
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  submitBooking(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/send-booking-email`, data).pipe(
      catchError(error => {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send confirmation email. Please contact support.');
      })
    );
  }
}
