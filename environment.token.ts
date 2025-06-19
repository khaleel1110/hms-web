import { InjectionToken } from '@angular/core';

export interface Environment {
  useEmulator: boolean;
  apiUrl: string;
  firebaseApp: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  emailAddress: string;
  placeholderImageBase: string;
}

export const ENVIRONMENT = new InjectionToken<Environment>('environment');
