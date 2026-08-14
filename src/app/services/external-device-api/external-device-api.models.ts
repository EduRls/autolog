export type ExternalScalar = string | number | boolean | null;

export interface ExternalApiSuccess<T> {
  success: true;
  data: T;
}

export interface ExternalApiFailure {
  success: false;
  error: { code: string; message: string };
}

export type ExternalApiResponse<T> = ExternalApiSuccess<T> | ExternalApiFailure;

export interface ExternalDevice {
  id?: string | number | null;
  imei: string | number;
  alias?: string | null;
  name?: string | null;
  unit?: string | null;
  active?: boolean | number | string | null;
  isActive?: boolean | number | string | null;
  device?: ExternalDevice | null;
}

export interface ExternalTank {
  capacity?: number | string | null;
  percentageAlert?: number | string | null;
  levelPercentage?: number | string | null;
  levelLiters?: number | string | null;
}

export interface ExternalTransmission {
  timestamp?: number | string | null;
  date?: number | string | null;
  battery?: number | string | null;
  batteryPercentage?: number | string | null;
  rsrp?: number | string | null;
  signal?: number | string | null;
}

export interface ExternalReading {
  timestamp?: number | string | null;
  date?: number | string | null;
  createdAt?: number | string | null;
  level_percentage?: number | string | null;
  levelPercentage?: number | string | null;
  level_liters?: number | string | null;
  levelLiters?: number | string | null;
  liters?: number | string | null;
}

export interface ExternalDeviceDetail extends ExternalDevice, ExternalTank {
  device?: ExternalDevice | null;
  tank?: ExternalTank | null;
  lastReading?: ExternalReading | null;
  lastTransmission?: ExternalTransmission | number | string | null;
  responsible?: string | null;
  manager?: string | null;
  phone?: string | number | null;
  avarageConsumptionPercentage?: number | string | null;
  avarageConsumptionLiters?: number | string | null;
  lastPercentageRecharged?: number | string | null;
  lastLitersRecharged?: number | string | null;
  battery?: number | string | null;
  rsrp?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  street?: string | null;
  interiorNumber?: string | number | null;
  externalNumber?: string | number | null;
  suburb?: string | null;
  postalCode?: string | number | null;
  township?: string | null;
  city?: string | null;
  state?: string | null;
  reference?: string | null;
}

export type ExternalConsumption = ExternalReading;
export type ExternalHistoricalReading = ExternalReading;

export interface ExternalRecharge extends ExternalReading {
  percentage?: number | string | null;
  percentageRecharged?: number | string | null;
  litersRecharged?: number | string | null;
  recharge_percentage?: number | string | null;
  recharge_liters?: number | string | null;
}

export type ExternalCollection<T> = T[] | {
  items?: T[];
  devices?: T[];
  consumptions?: T[];
  historical?: T[];
  readings?: T[];
  recharges?: T[];
};
