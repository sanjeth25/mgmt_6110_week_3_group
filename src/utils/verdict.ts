import { VerdictCalculation } from '../types';

export function formatWaitTime(wait: number | null): string {
  if (wait === null || wait === undefined) {
    return '—';
  }
  if (wait === 0) {
    return 'Arriving';
  }
  return `${wait} min`;
}

export function formatWaitSentenceFragment(wait: number | null): string {
  if (wait === null || wait === undefined) {
    return 'no scheduled bus';
  }
  if (wait === 0) {
    return 'is arriving (under 1 min)';
  }
  return `reaches in ${wait} min`;
}

export function computeVerdict(
  serviceNo: string,
  wait1: number | null,
  wait2: number | null,
  walk: number
): VerdictCalculation {
  // Case: No buses operating
  if (wait1 === null && wait2 === null) {
    return {
      status: 'NOT_OPERATING',
      badgeText: 'NOT RUNNING',
      sentence: `No scheduled buses currently operating for Service ${serviceNo}.`,
      leaveInMinutes: null,
      colorType: 'not-operating',
      activeBus: null,
    };
  }

  // Case: First slot is null but second slot exists
  if (wait1 === null && wait2 !== null) {
    if (wait2 <= walk) {
      return {
        status: 'TOO_LATE',
        badgeText: 'TOO LATE',
        sentence: `TOO LATE — next ${serviceNo} ${formatWaitSentenceFragment(wait2)} and it is a ${walk} min walk.`,
        leaveInMinutes: null,
        colorType: 'too-late',
        activeBus: 2,
      };
    }
    if (wait2 <= walk + 2) {
      return {
        status: 'LEAVE_NOW',
        badgeText: 'YES — LEAVE NOW',
        sentence: `YES — leave now, the ${serviceNo} reaches in ${wait2} min and it is a ${walk} min walk.`,
        leaveInMinutes: Math.max(0, wait2 - walk),
        colorType: 'leave-now',
        activeBus: 2,
      };
    }
    if (wait2 <= walk + 6) {
      const leaveIn = wait2 - walk;
      return {
        status: 'SOON',
        badgeText: 'SOON',
        sentence: `SOON — next ${serviceNo} in about ${wait2} min, leave in ${leaveIn} min.`,
        leaveInMinutes: leaveIn,
        colorType: 'soon',
        activeBus: 2,
      };
    }
    const leaveIn = wait2 - walk;
    return {
      status: 'NOT_YET',
      badgeText: 'NOT YET',
      sentence: `NOT YET — next ${serviceNo} in about ${wait2} min, leave in ${leaveIn} min.`,
      leaveInMinutes: leaveIn,
      colorType: 'not-yet',
      activeBus: 2,
    };
  }

  // At this point, wait1 is a valid number
  const w1 = wait1 as number;

  // First bus unreachable: wait1 <= walk
  if (w1 <= walk) {
    const bus1ArrivingOrMin = w1 === 0 ? 'arriving' : `${w1} min`;

    // Check second bus
    if (wait2 === null) {
      return {
        status: 'TOO_LATE',
        badgeText: 'TOO LATE',
        sentence: `TOO LATE — you have missed this one (the first ${serviceNo} reaches in ${w1 === 0 ? 'under 1 min' : `${w1} min`} and it is a ${walk} min walk), and no second bus is scheduled.`,
        leaveInMinutes: null,
        colorType: 'too-late',
        activeBus: 1,
      };
    }

    const w2 = wait2;
    if (w2 <= walk) {
      return {
        status: 'TOO_LATE',
        badgeText: 'TOO LATE',
        sentence: `TOO LATE — you have missed both buses (first in ${w1 === 0 ? 'under 1 min' : `${w1} min`}, next in ${w2 === 0 ? 'under 1 min' : `${w2} min`}, and it is a ${walk} min walk).`,
        leaveInMinutes: null,
        colorType: 'too-late',
        activeBus: 1,
      };
    }

    if (w2 <= walk + 2) {
      return {
        status: 'LEAVE_NOW',
        badgeText: 'YES — LEAVE NOW',
        sentence: `TOO LATE for the first bus (${bus1ArrivingOrMin}), but YES — leave now, the next ${serviceNo} reaches in ${w2} min and it is a ${walk} min walk.`,
        leaveInMinutes: Math.max(0, w2 - walk),
        colorType: 'leave-now',
        activeBus: 2,
      };
    }

    if (w2 <= walk + 6) {
      const leaveIn = w2 - walk;
      return {
        status: 'SOON',
        badgeText: 'SOON',
        sentence: `TOO LATE for the first bus (${bus1ArrivingOrMin}). For the second bus: SOON — reaches in ${w2} min and it is a ${walk} min walk, leave in ${leaveIn} min.`,
        leaveInMinutes: leaveIn,
        colorType: 'soon',
        activeBus: 2,
      };
    }

    const leaveIn = w2 - walk;
    return {
      status: 'NOT_YET',
      badgeText: 'NOT YET',
      sentence: `TOO LATE for the first bus (${bus1ArrivingOrMin}). NOT YET — next ${serviceNo} in about ${w2} min, leave in ${leaveIn} min.`,
      leaveInMinutes: leaveIn,
      colorType: 'not-yet',
      activeBus: 2,
    };
  }

  // First bus IS reachable: wait1 > walk
  if (w1 <= walk + 2) {
    return {
      status: 'LEAVE_NOW',
      badgeText: 'YES — LEAVE NOW',
      sentence: `YES — leave now, the ${serviceNo} reaches in ${w1} min and it is a ${walk} min walk.`,
      leaveInMinutes: Math.max(0, w1 - walk),
      colorType: 'leave-now',
      activeBus: 1,
    };
  }

  if (w1 <= walk + 6) {
    const leaveIn = w1 - walk;
    return {
      status: 'SOON',
      badgeText: 'SOON',
      sentence: `SOON — the ${serviceNo} reaches in ${w1} min and it is a ${walk} min walk; leave in ${leaveIn} min.`,
      leaveInMinutes: leaveIn,
      colorType: 'soon',
      activeBus: 1,
    };
  }

  const leaveIn = w1 - walk;
  return {
    status: 'NOT_YET',
    badgeText: 'NOT YET',
    sentence: `NOT YET — next ${serviceNo} in about ${w1} min, leave in ${leaveIn} min.`,
    leaveInMinutes: leaveIn,
    colorType: 'not-yet',
    activeBus: 1,
  };
}

export function formatDataAge(timestampMs: number | null): string {
  if (!timestampMs) return '';
  const secondsAgo = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (secondsAgo < 5) return 'just now';
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const minutesAgo = Math.floor(secondsAgo / 60);
  return `${minutesAgo}m ago`;
}
