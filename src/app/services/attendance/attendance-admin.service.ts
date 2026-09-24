import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AttendanceDashboardResponse,
  AttendanceRecordsRequest,
  AttendanceRecordsResponse,
} from '../../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceAdminService {
  constructor(private readonly functions: Functions) {}

  async getDashboard(): Promise<AttendanceDashboardResponse> {
    const callable = httpsCallable<Record<string, never>, AttendanceDashboardResponse>(
      this.functions,
      'getAttendanceDashboard'
    );
    return (await callable({})).data;
  }

  async listRecords(request: AttendanceRecordsRequest): Promise<AttendanceRecordsResponse> {
    const callable = httpsCallable<AttendanceRecordsRequest, AttendanceRecordsResponse>(
      this.functions,
      'listAttendanceRecords'
    );
    return (await callable(request)).data;
  }
}
