import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ExternalApiResponse,
  ExternalCollection,
  ExternalConsumption,
  ExternalDevice,
  ExternalDeviceDetail,
  ExternalHistoricalReading,
  ExternalRecharge
} from './external-device-api.models';

export class ExternalDeviceApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ExternalDeviceApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class ExternalDeviceApiService {
  private readonly baseUrl = environment.externalDeviceApiUrl;

  constructor(private readonly http: HttpClient, private readonly auth: Auth) {}

  getDevices(signal?: AbortSignal): Promise<ExternalCollection<ExternalDevice>> {
    return this.request<ExternalCollection<ExternalDevice>>('/devices', undefined, signal);
  }

  getDeviceDetail(imei: string, signal?: AbortSignal): Promise<ExternalDeviceDetail> {
    return this.request<ExternalDeviceDetail>(`/devices/${encodeURIComponent(imei)}`, undefined, signal);
  }

  getConsumptions(imei: string, signal?: AbortSignal): Promise<ExternalCollection<ExternalConsumption>> {
    return this.request<ExternalCollection<ExternalConsumption>>(`/devices/${encodeURIComponent(imei)}/consumptions`, undefined, signal);
  }

  getHistorical(imei: string, init: number, end: number, signal?: AbortSignal): Promise<ExternalCollection<ExternalHistoricalReading>> {
    return this.request<ExternalCollection<ExternalHistoricalReading>>(
      `/devices/${encodeURIComponent(imei)}/historical`,
      new URLSearchParams({ init: String(init), end: String(end) }),
      signal
    );
  }

  getRecharges(imei: string, signal?: AbortSignal): Promise<ExternalCollection<ExternalRecharge>> {
    return this.request<ExternalCollection<ExternalRecharge>>(`/devices/${encodeURIComponent(imei)}/recharges`, undefined, signal);
  }

  private async request<T>(path: string, query?: URLSearchParams, signal?: AbortSignal): Promise<T> {
    try {
      return await this.authorizedRequest<T>(path, query, false, signal);
    } catch (error: unknown) {
      if (error instanceof ExternalDeviceApiError && error.status === 401) {
        return this.authorizedRequest<T>(path, query, true, signal);
      }
      throw error;
    }
  }

  private async authorizedRequest<T>(path: string, query: URLSearchParams | undefined, forceRefresh: boolean, signal?: AbortSignal): Promise<T> {
    const user = this.auth.currentUser;
    if (!user) throw new ExternalDeviceApiError(401, 'UNAUTHENTICATED', 'La sesión ha expirado.');

    const token = await user.getIdToken(forceRefresh);
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}${path}`);
    if (query) query.forEach((value, key) => url.searchParams.set(key, value));

    try {
      const request = this.http.get<ExternalApiResponse<T>>(url.toString(), {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}`, Accept: 'application/json' })
      });
      const response = await firstValueFrom(signal ? request.pipe(takeUntil(fromEvent(signal, 'abort'))) : request);
      if (response.success === false) throw new ExternalDeviceApiError(400, response.error.code, response.error.message);
      return response.data;
    } catch (error: unknown) {
      if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
      if (error instanceof ExternalDeviceApiError) throw error;
      if (error instanceof HttpErrorResponse) {
        const body: unknown = error.error;
        const controlled = this.controlledError(body);
        throw new ExternalDeviceApiError(error.status, controlled?.code ?? 'REQUEST_FAILED', controlled?.message ?? this.messageForStatus(error.status));
      }
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ExternalDeviceApiError(0, 'NETWORK_ERROR', 'No fue posible comunicarse con el servicio de monitoreo.');
    }
  }

  private controlledError(value: unknown): { code: string; message: string } | null {
    if (!value || typeof value !== 'object' || !('error' in value)) return null;
    const error = value.error;
    if (!error || typeof error !== 'object' || !('code' in error) || !('message' in error)) return null;
    return typeof error.code === 'string' && typeof error.message === 'string' ? { code: error.code, message: error.message } : null;
  }

  private messageForStatus(status: number): string {
    if (status === 401) return 'La sesión ha expirado. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permiso para consultar esta información.';
    if (status === 404) return 'El dispositivo o recurso solicitado no fue encontrado.';
    if (status === 429) return 'Se alcanzó temporalmente el límite de consultas. Intenta más tarde.';
    if (status === 502 || status === 504) return 'El servicio de monitoreo no está disponible temporalmente.';
    return 'No fue posible consultar la información del expendio.';
  }
}
