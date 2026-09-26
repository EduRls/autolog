import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AttendanceDashboardResponse,
  AttendanceRecordsRequest,
  AttendanceRecordsResponse,
} from '../../models/attendance.model';
import { PlantScopeService } from '../plants/plant-scope.service';

@Injectable({ providedIn: 'root' })
export class AttendanceAdminService {
  constructor(
    private readonly functions: Functions,
    private readonly plantScope: PlantScopeService
  ) {}

  async getDashboard(): Promise<AttendanceDashboardResponse> {
    await this.plantScope.initialize();
    const callable = httpsCallable<{ plantId: string | null }, AttendanceDashboardResponse>(
      this.functions,
      'getAttendanceDashboard'
    );
    return (await callable({ plantId: this.plantScope.getActivePlantId() })).data;
  }

  async listRecords(request: AttendanceRecordsRequest): Promise<AttendanceRecordsResponse> {
    await this.plantScope.initialize();
    const callable = httpsCallable<AttendanceRecordsRequest, AttendanceRecordsResponse>(
      this.functions,
      'listAttendanceRecords'
    );
    return (await callable({
      ...request,
      plantId: this.plantScope.getActivePlantId(),
    })).data;
  }
}
