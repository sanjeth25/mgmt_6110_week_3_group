export interface BusServiceArrival {
  serviceNo: string;
  ServiceNo?: string;
  nextBus: number | null;
  nextBus2: number | null;
  waits?: (number | null)[];
}

export interface BusApiResponse {
  busStopCode: string;
  fetchedAt: string;
  timestamp: number;
  services: BusServiceArrival[];
  error?: string;
  message?: string;
  status?: number;
}

export interface HealthApiResponse {
  keyPresent: boolean;
  ltaAnswered: boolean;
  upstreamStatus: number | null;
  latencyMs: number | null;
  timestamp?: string;
  message?: string;
  error?: string;
}

export type VerdictStatus = 'LEAVE_NOW' | 'SOON' | 'NOT_YET' | 'TOO_LATE' | 'NOT_OPERATING';

export interface VerdictCalculation {
  status: VerdictStatus;
  badgeText: string;
  sentence: string;
  leaveInMinutes: number | null;
  colorType: 'leave-now' | 'soon' | 'not-yet' | 'too-late' | 'not-operating';
  activeBus: 1 | 2 | null;
}
