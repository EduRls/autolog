import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AttendanceService } from '../services/attendance/attendance.service';

export const attendanceGuard: CanActivateFn = async () => {
  const attendance = inject(AttendanceService);
  const router = inject(Router);
  try {
    await attendance.getMyProfile();
    return true;
  } catch {
    return router.createUrlTree(['/reloj/login']);
  }
};
