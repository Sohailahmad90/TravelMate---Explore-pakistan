export function formatPkr(amount: number | undefined | null): string {
  const safe = Number.isFinite(Number(amount)) ? Math.round(Number(amount)) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Flexible';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function daysBetween(startDate: string, endDate: string): number {
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return 1;
  return Math.max(1, Math.round((e - s) / 86400000));
}

export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const s1 = new Date(aStart).getTime();
  const e1 = new Date(aEnd).getTime();
  const s2 = new Date(bStart).getTime();
  const e2 = new Date(bEnd).getTime();
  if (!Number.isFinite(s1) || !Number.isFinite(e1) || !Number.isFinite(s2) || !Number.isFinite(e2)) {
    return false;
  }
  return s1 < e2 && s2 < e1;
}

export function computeBuddyMatchScore(
  target: {
    destination: string;
    startDate: string;
    endDate: string;
    budgetMinPkr: number;
    budgetMaxPkr: number;
    interests: string[];
    desiredGroupSize: number;
  },
  criteria: {
    destination: string;
    startDate?: string;
    endDate?: string;
    budgetPkr: number;
    interests: string[];
    desiredGroupSize?: number;
  }
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    !criteria.destination ||
    target.destination.toLowerCase().includes(criteria.destination.toLowerCase()) ||
    criteria.destination.toLowerCase().includes(target.destination.toLowerCase())
  ) {
    score += 35;
    reasons.push('Same destination corridor');
  }

  if (criteria.startDate && criteria.endDate && datesOverlap(target.startDate, target.endDate, criteria.startDate, criteria.endDate)) {
    score += 25;
    reasons.push('Overlapping travel dates');
  } else if (!criteria.startDate) {
    score += 15;
  }

  if (criteria.budgetPkr >= target.budgetMinPkr * 0.8 && criteria.budgetPkr <= target.budgetMaxPkr * 1.2) {
    score += 20;
    reasons.push('Aligned PKR budget range');
  }

  const sharedInterests = target.interests.filter((i) =>
    criteria.interests.some((c) => c.toLowerCase() === i.toLowerCase())
  );
  if (sharedInterests.length > 0) {
    score += Math.min(15, sharedInterests.length * 5);
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);
  }

  if (!criteria.desiredGroupSize || Math.abs(target.desiredGroupSize - criteria.desiredGroupSize) <= 2) {
    score += 5;
    reasons.push('Compatible group size');
  }

  return {
    score: Math.min(99, Math.max(25, score)),
    reasons: reasons.length ? reasons : ['General northern corridor match'],
  };
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}
