import { Component, OnInit, isDevMode } from '@angular/core';
import { AttendanceDashboardActivity } from '../../models/attendance.model';
import { AttendanceAdminService } from '../../services/attendance/attendance-admin.service';

export type AttendanceDashboardState = 'loading' | 'data' | 'empty' | 'error';

@Component({
  selector: 'app-asistencia-panel',
  templateUrl: './asistencia-panel.page.html',
  styleUrls: ['../asistencia.shared.scss'],
})
export class AsistenciaPanelPage implements OnInit {
  state: AttendanceDashboardState = 'loading';
  date = '';
  lastUpdated: Date | null = null;
  private loadVersion = 0;
  recentActivity: AttendanceDashboardActivity[] = [];
  metrics = [
    { key: 'present', label: 'Presentes ahora', helper: 'Con jornada abierta', value: 0, icon: 'people-outline', className: 'metric-success' },
    { key: 'checkIns', label: 'Entradas', helper: 'Registradas hoy', value: 0, icon: 'log-in-outline', className: 'metric-entry' },
    { key: 'checkOuts', label: 'Salidas', helper: 'Jornadas cerradas', value: 0, icon: 'log-out-outline', className: 'metric-exit' },
    { key: 'movements', label: 'Movimientos', helper: 'Actividad total', value: 0, icon: 'swap-vertical-outline', className: 'metric-total' },
  ];

  constructor(private readonly attendance: AttendanceAdminService) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const version = ++this.loadVersion;
    this.state = 'loading';
    try {
      const dashboard = await this.attendance.getDashboard();
      if (version !== this.loadVersion) return;
      this.date = dashboard.date;
      this.recentActivity = dashboard.recentActivity;
      this.lastUpdated = new Date();
      this.metrics = this.metrics.map(metric => ({
        ...metric,
        value: dashboard.metrics[metric.key as keyof typeof dashboard.metrics],
      }));
      this.state = dashboard.metrics.movements ? 'data' : 'empty';
    } catch (error) {
      if (version !== this.loadVersion) return;
      if (isDevMode()) console.error('[getAttendanceDashboard]', error);
      this.state = 'error';
    }
  }

  eventLabel(type: AttendanceDashboardActivity['eventType']): string {
    return type === 'CHECK_IN' ? 'Entrada' : 'Salida';
  }

  get checkIns(): number {
    return this.metricValue('checkIns');
  }

  get checkOuts(): number {
    return this.metricValue('checkOuts');
  }

  get openShifts(): number {
    return Math.max(this.checkIns - this.checkOuts, 0);
  }

  get completionRate(): number {
    return this.checkIns ? Math.min(Math.round((this.checkOuts / this.checkIns) * 100), 100) : 0;
  }

  displayDate(): string {
    const parts = this.date.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) return this.date;
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  formatUpdatedAt(): string {
    if (!this.lastUpdated) return '';
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(this.lastUpdated);
  }

  trackActivity(_: number, activity: AttendanceDashboardActivity): string {
    return activity.id;
  }

  private metricValue(key: 'checkIns' | 'checkOuts'): number {
    return this.metrics.find(metric => metric.key === key)?.value ?? 0;
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Mexico_City',
    }).format(new Date(value));
  }
}
