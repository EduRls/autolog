import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Capacitor } from '@capacitor/core';
import {
  AttendanceHistoryEvent,
  AttendanceLocationInput,
  AutologWorkerProfile,
  RegisterAttendanceResponse,
} from '../../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private readonly functions: Functions) {}

  async getMyProfile(): Promise<AutologWorkerProfile> {
    const callable = httpsCallable<Record<string, never>, AutologWorkerProfile>(
      this.functions,
      'getMyAutologProfile'
    );
    return (await callable({})).data;
  }

  async registerAttendance(
    idempotencyKey: string,
    ubicacion?: AttendanceLocationInput
  ): Promise<RegisterAttendanceResponse> {
    const callable = httpsCallable<
      {
        idempotencyKey: string;
        origen: 'APP' | 'WEB';
        ubicacion?: AttendanceLocationInput;
        dispositivo: { platform: string };
      },
      RegisterAttendanceResponse
    >(this.functions, 'registerAttendance');
    return (await callable({
      idempotencyKey,
      origen: Capacitor.getPlatform() === 'web' ? 'WEB' : 'APP',
      ...(ubicacion ? { ubicacion } : {}),
      dispositivo: { platform: Capacitor.getPlatform() },
    })).data;
  }

  async getMyAttendance(limit = 20): Promise<AttendanceHistoryEvent[]> {
    const callable = httpsCallable<{ limit: number }, { events: AttendanceHistoryEvent[] }>(
      this.functions,
      'getMyAttendance'
    );
    return (await callable({ limit })).data.events;
  }
}
