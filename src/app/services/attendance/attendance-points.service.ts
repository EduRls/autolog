import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AttendancePoint,
  AttendancePointAssignments,
  AttendancePointDistributor,
  AttendancePointInput,
  AttendancePointsLoadResult,
} from '../../models/attendance-point.model';
import { DistribuidoresService } from '../admVentas/distribuidores/distribuidores.service';

@Injectable({ providedIn: 'root' })
export class AttendancePointsService {
  constructor(
    private readonly functions: Functions,
    private readonly distribuidores: DistribuidoresService,
  ) {}

  async listPoints(): Promise<AttendancePoint[]> {
    const callable = httpsCallable<Record<string, never>, AttendancePointsLoadResult>(this.functions, 'listAttendancePoints');
    return (await callable({})).data.puntos;
  }

  async getAssignments(puntoId: string): Promise<string[]> {
    const callable = httpsCallable<{ puntoId: string }, AttendancePointAssignments>(this.functions, 'getAttendancePointAssignments');
    return (await callable({ puntoId })).data.distribuidorIds;
  }

  async createPoint(input: AttendancePointInput): Promise<{ id: string }> {
    const callable = httpsCallable<AttendancePointInput, { id: string }>(this.functions, 'createAttendancePoint');
    return (await callable(input)).data;
  }

  async updatePoint(id: string, input: AttendancePointInput): Promise<{ id: string }> {
    const callable = httpsCallable<AttendancePointInput & { id: string }, { id: string }>(this.functions, 'updateAttendancePoint');
    return (await callable({ id, ...input })).data;
  }

  async setAssignments(puntoId: string, distribuidorIds: string[]): Promise<void> {
    const callable = httpsCallable<{ puntoId: string; distribuidorIds: string[] }, { puntoId: string }>(this.functions, 'setAttendancePointAssignments');
    await callable({ puntoId, distribuidorIds });
  }

  async listActiveDistributors(): Promise<AttendancePointDistributor[]> {
    return (await this.distribuidores.getActivos()).map(({ id, nombre, identificador }) => ({ id, nombre, identificador }));
  }
}
