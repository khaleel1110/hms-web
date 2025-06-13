import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideFirebaseApp, initializeApp, getApp} from '@angular/fire/app';
import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {provideNativeDateAdapter} from '@angular/material/core';
import {connectAuthEmulator, getAuth, provideAuth} from '@angular/fire/auth';

import {connectFunctionsEmulator, getFunctions, provideFunctions} from '@angular/fire/functions';
import {getStorage, provideStorage} from '@angular/fire/storage';
import {environment} from '../environments/environment';
import { provideFirestore, getFirestore, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, connectFirestoreEmulator } from '@angular/fire/firestore';
export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeDateAdapter(),
    provideRouter(routes),
    provideHttpClient(),
    provideNativeDateAdapter(), // Added to fix DateAdapter error
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

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
    provideStorage(() => getStorage()),

  ]
};
