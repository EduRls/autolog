export type AttendanceType = 'ENTRADA' | 'SALIDA';

export interface AutologWorkerProfile {
  uid: string;
  usuario: {
    email: string;
    rol: string;
    accesoAutolog: boolean;
    accesoAsistencia: boolean;
  };
  personal: {
    tipo: 'DISTRIBUIDOR';
    id: string;
    nombreCompleto: string;
    identificador?: string;
    ruta?: string;
    zona?: string;
  };
}

export interface AttendanceLocationInput {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface RegisterAttendanceResponse {
  asistenciaId: string;
  tipo: AttendanceType;
  fechaLocal: string;
  registradoEn: string;
  duplicado: boolean;
}

export interface AttendanceHistoryEvent {
  id: string;
  tipo: AttendanceType;
  fechaHoraServidor: string | null;
  fechaLocal: string;
  timezone: string;
  origen: 'APP' | 'WEB';
}

export type AttendanceEventType = 'CHECK_IN' | 'CHECK_OUT';
export type AttendanceDayStatus = 'OPEN' | 'COMPLETED';

export interface AttendanceDashboardActivity {
  id: string;
  distributorId: string;
  distributorName: string;
  identifier: string | null;
  eventType: AttendanceEventType;
  eventTime: string;
  pointName: string;
}

export interface AttendanceDashboardResponse {
  date: string;
  metrics: {
    present: number;
    checkIns: number;
    checkOuts: number;
    movements: number;
  };
  recentActivity: AttendanceDashboardActivity[];
}

export interface AttendanceAdminRecord {
  verification?: { checkIn: AttendanceValidationEvidence | null; checkOut: AttendanceValidationEvidence | null };
  id: string;
  distributor: {
    id: string;
    name: string;
    identifier: string | null;
  };
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workedMinutes: number;
  pointName: string;
  status: AttendanceDayStatus;
}

export interface AttendanceValidationEvidence {
  method: 'FACE_MOCK' | 'FACE_PRESENCE';
  authVerified?: boolean;
  deviceVerified?: boolean;
  geofenceVerified?: boolean;
  presenceVerified?: boolean;
  identityBiometricVerified?: false;
}

export interface AttendanceRecordsRequest {
  pageSize?: number;
  cursor?: string | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceDayStatus | '';
}

export interface AttendanceRecordsResponse {
  records: AttendanceAdminRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}
