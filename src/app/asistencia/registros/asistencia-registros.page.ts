import { Component, OnInit, isDevMode } from '@angular/core';
import { AttendanceAdminRecord, AttendanceDayStatus } from '../../models/attendance.model';
import { AttendanceAdminService } from '../../services/attendance/attendance-admin.service';

export type AttendanceRecordsState = 'loading' | 'empty' | 'error' | 'data';

@Component({
  selector: 'app-asistencia-registros',
  templateUrl: './asistencia-registros.page.html',
  styleUrls: ['../asistencia.shared.scss'],
})
export class AsistenciaRegistrosPage implements OnInit {
  state: AttendanceRecordsState = 'loading';
  rows: AttendanceAdminRecord[] = [];
  search = '';
  dateFrom = '';
  dateTo = '';
  status: AttendanceDayStatus | '' = '';
  page = 1;
  hasMore = false;
  private pageCursors: Array<string | null> = [null];
  private loadVersion = 0;

  constructor(private readonly attendance: AttendanceAdminService) {}

  ngOnInit(): void {
    void this.loadPage();
  }

  async applyFilters(): Promise<void> {
    this.page = 1;
    this.pageCursors = [null];
    await this.loadPage();
  }

  async nextPage(): Promise<void> {
    if (!this.hasMore || !this.pageCursors[this.page]) return;
    this.page += 1;
    await this.loadPage();
  }

  async previousPage(): Promise<void> {
    if (this.page <= 1) return;
    this.page -= 1;
    await this.loadPage();
  }

  async retry(): Promise<void> {
    await this.loadPage();
  }

  formatTime(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Mexico_City',
    }).format(new Date(value));
  }

  formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
  }

  statusLabel(status: AttendanceDayStatus): string {
    return status === 'OPEN' ? 'En jornada' : 'Completo';
  }

  private async loadPage(): Promise<void> {
    const version = ++this.loadVersion;
    this.state = 'loading';
    try {
      const response = await this.attendance.listRecords({
        pageSize: 20,
        cursor: this.pageCursors[this.page - 1],
        search: this.search.trim(),
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        status: this.status,
      });
      if (version !== this.loadVersion) return;
      this.rows = response.records;
      this.hasMore = response.hasMore;
      if (response.nextCursor) this.pageCursors[this.page] = response.nextCursor;
      else this.pageCursors.splice(this.page);
      this.state = this.rows.length ? 'data' : 'empty';
    } catch (error) {
      if (version !== this.loadVersion) return;
      if (isDevMode()) console.error('[listAttendanceRecords]', error);
      this.rows = [];
      this.hasMore = false;
      this.state = 'error';
    }
  }
}
