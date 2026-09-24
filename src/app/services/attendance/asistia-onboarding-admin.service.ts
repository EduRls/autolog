import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface AsistiaAdminStatus {
  onboarding: { completed: boolean; generalPoliciesAccepted: boolean; biometricMode: 'PRESENCE_ONLY' | 'BIOMETRIC_OPT_IN' | null };
  device: { linked: boolean; platform: string | null; linkedAt: string | null };
  faceVerification: { presenceConfigured: boolean; biometricEnrollmentStatus: string };
  canResetDevice: boolean;
}

@Injectable({ providedIn: 'root' })
export class AsistiaOnboardingAdminService {
  constructor(private readonly functions: Functions) {}
  async getStatus(distribuidorId: string): Promise<AsistiaAdminStatus> {
    return (await httpsCallable<{ distribuidorId: string }, AsistiaAdminStatus>(
      this.functions, 'getDistributorAsistiaStatus')({ distribuidorId })).data;
  }
  async resetDevice(distribuidorId: string): Promise<void> {
    await httpsCallable(this.functions, 'resetAsistiaDevice')({ distribuidorId });
  }
}
