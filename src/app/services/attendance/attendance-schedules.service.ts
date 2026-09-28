import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AttendanceScheduleAssignment,
  AttendanceScheduleInput,
} from '../../models/attendance.model';
import { AttendancePointDistributor } from '../../models/attendance-point.model';
import { DistribuidoresService } from '../admVentas/distribuidores/distribuidores.service';
import { PlantScopeService } from '../plants/plant-scope.service';

@Injectable({ providedIn: 'root' })
export class AttendanceSchedulesService {
  constructor(
    private readonly functions: Functions,
    private readonly plantScope: PlantScopeService,
    private readonly distributors: DistribuidoresService,
  ) {}

  async load(): Promise<{
    employees: AttendancePointDistributor[];
    assignments: AttendanceScheduleAssignment[];
  }> {
    await this.plantScope.initialize();
    const plantId = this.plantScope.resolveWritePlantId();
    const callable = httpsCallable<
      { plantId: string }, { assignments: AttendanceScheduleAssignment[] }
    >(this.functions, 'listAttendanceSchedules');
    const [employees, response] = await Promise.all([
      this.distributors.getActivos(),
      callable({ plantId }),
    ]);
    return {
      employees: employees.map(({ id, nombre, identificador }) => ({
        id, nombre, identificador,
      })),
      assignments: response.data.assignments,
    };
  }

  async assign(input: AttendanceScheduleInput): Promise<{ assigned: number }> {
    await this.plantScope.initialize();
    const payload = {
      ...input,
      plantId: this.plantScope.resolveWritePlantId(),
    };
    const callable = httpsCallable<typeof payload, { assigned: number }>(
      this.functions, 'assignAttendanceSchedule',
    );
    return (await callable(payload)).data;
  }
}
