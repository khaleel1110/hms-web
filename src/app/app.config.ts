import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import {provideFirebaseApp, initializeApp, getApp} from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import {provideStorage, getStorage, connectStorageEmulator} from '@angular/fire/storage';
import { provideFirestore, getFirestore, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, connectFirestoreEmulator } from '@angular/fire/firestore';
import { environment } from '../environments/environment'; // Ensure path is correct
import { provideHttpClient } from '@angular/common/http';
import {provideNativeDateAdapter} from '@angular/material/core';
import {ENVIRONMENT} from '../../environment.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeDateAdapter(),
    provideNativeDateAdapter(), // Added to fix DateAdapter error
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    // Firebase App Initialization
    provideFirebaseApp(() => initializeApp(environment.firebaseApp)), // Use environment.firebase, not firebaseApp

    // Authentication
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
      }
      return auth;
    }),

    // Firestore
    provideFirestore(() => {
      const firestore = initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
      if (environment.useEmulator) {
        connectFirestoreEmulator(firestore, 'localhost', 8980);
      }
      return firestore;
    }),

    // Functions
    provideFunctions(() => {
      const functions = getFunctions(getApp());
      if (environment.useEmulator) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),

    // Storage
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulator) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),
    { provide: ENVIRONMENT, useValue: environment }
  ]
};
