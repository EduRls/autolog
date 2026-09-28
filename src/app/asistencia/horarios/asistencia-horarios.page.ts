import { Component, OnInit, isDevMode } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AttendanceScheduleAssignment } from '../../models/attendance.model';
import { AttendancePointDistributor } from '../../models/attendance-point.model';
import { AttendanceSchedulesService } from '../../services/attendance/attendance-schedules.service';

type ScheduleState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-asistencia-horarios',
  templateUrl: './asistencia-horarios.page.html',
  styleUrls: ['../asistencia.shared.scss', './asistencia-horarios.page.scss'],
})
export class AsistenciaHorariosPage implements OnInit {
  state: ScheduleState = 'loading';
  employees: AttendancePointDistributor[] = [];
  assignments: AttendanceScheduleAssignment[] = [];
  selectedIds = new Set<string>();
  search = '';
  saving = false;
  saveError = '';
  form = {
    scheduleName: 'Horario general',
    startTime: '08:00',
    endTime: '17:00',
    toleranceMinutes: 10,
    days: [1, 2, 3, 4, 5] as number[],
  };
  readonly weekdays = [
    { value: 1, label: 'Lunes', short: 'L' },
    { value: 2, label: 'Martes', short: 'M' },
    { value: 3, label: 'Miércoles', short: 'X' },
    { value: 4, label: 'Jueves', short: 'J' },
    { value: 5, label: 'Viernes', short: 'V' },
    { value: 6, label: 'Sábado', short: 'S' },
    { value: 7, label: 'Domingo', short: 'D' },
  ];

  constructor(
    private readonly schedules: AttendanceSchedulesService,
    private readonly toastController: ToastController,
  ) {}

  ngOnInit(): void { void this.load(); }

  get filteredEmployees(): AttendancePointDistributor[] {
    const query = this.normalize(this.search);
    if (!query) return this.employees;
    return this.employees.filter(employee => this.normalize(
      `${employee.nombre} ${employee.identificador || ''}`,
    ).includes(query));
  }

  get validForm(): boolean {
    return Boolean(this.form.scheduleName.trim()) &&
      this.form.startTime !== this.form.endTime &&
      this.form.days.length > 0 && this.selectedIds.size > 0 &&
      Number.isInteger(Number(this.form.toleranceMinutes)) &&
      Number(this.form.toleranceMinutes) >= 0 &&
      Number(this.form.toleranceMinutes) <= 180;
  }

  async load(): Promise<void> {
    this.state = 'loading';
    try {
      const result = await this.schedules.load();
      this.employees = result.employees;
      this.assignments = result.assignments;
      this.state = 'ready';
    } catch (error) {
      if (isDevMode()) console.error('[listAttendanceSchedules]', error);
      this.state = 'error';
    }
  }

  toggleEmployee(id: string, selected: boolean): void {
    if (selected) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  toggleDay(day: number): void {
    this.form.days = this.form.days.includes(day)
      ? this.form.days.filter(value => value !== day)
      : [...this.form.days, day].sort((left, right) => left - right);
  }

  selectVisible(): void {
    this.filteredEmployees.forEach(employee => this.selectedIds.add(employee.id));
  }

  clearSelection(): void { this.selectedIds.clear(); }

  async save(): Promise<void> {
    if (!this.validForm || this.saving) return;
    this.saving = true;
    this.saveError = '';
    try {
      const result = await this.schedules.assign({
        distributorIds: [...this.selectedIds],
        scheduleName: this.form.scheduleName.trim(),
        startTime: this.form.startTime,
        endTime: this.form.endTime,
        days: this.form.days,
        toleranceMinutes: Number(this.form.toleranceMinutes),
      });
      const toast = await this.toastController.create({
        message: `Horario asignado a ${result.assigned} empleado${result.assigned === 1 ? '' : 's'}.`,
        duration: 2600,
        color: 'success',
        position: 'top',
      });
      await toast.present();
      this.selectedIds.clear();
      await this.load();
    } catch (error) {
      if (isDevMode()) console.error('[assignAttendanceSchedule]', error);
      this.saveError = 'No fue posible guardar la asignación. Revisa los empleados y vuelve a intentar.';
    } finally {
      this.saving = false;
    }
  }

  daySummary(days: number[]): string {
    if (days.join(',') === '1,2,3,4,5') return 'Lun a vie';
    return days.map(day => this.weekdays.find(item => item.value === day)?.short).filter(Boolean).join(' · ');
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
