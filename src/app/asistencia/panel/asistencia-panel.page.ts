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
  private loadVersion = 0;
  recentActivity: AttendanceDashboardActivity[] = [];
  metrics = [
    { key: 'present', label: 'Presentes', value: 0, icon: 'people-outline', className: 'metric-success' },
    { key: 'checkIns', label: 'Entradas', value: 0, icon: 'log-in-outline', className: '' },
    { key: 'checkOuts', label: 'Salidas', value: 0, icon: 'log-out-outline', className: '' },
    { key: 'movements', label: 'Movimientos', value: 0, icon: 'swap-vertical-outline', className: '' },
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

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Mexico_City',
    }).format(new Date(value));
  }
}
