import { UrgencyType } from "@/types";

const urgencyWeights: Record<UrgencyType, number> = {
  medical: 35,
  bpl: 24,
  regular: 12,
};

export function getDaysSince(dateISO: string) {
  const now = new Date();
  const date = new Date(dateISO);
  const ms = Math.max(now.getTime() - date.getTime(), 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function calculatePriorityScore(params: {
  lastBookingDate: string;
  isBpl: boolean;
  urgency: UrgencyType;
}) {
  const days = getDaysSince(params.lastBookingDate);
  const dayFactor = Math.min(40, Math.floor(days * 1.5));
  const bplFactor = params.isBpl ? 25 : 5;
  const urgencyFactor = urgencyWeights[params.urgency];
  const score = Math.min(100, dayFactor + bplFactor + urgencyFactor);

  return {
    score,
    breakdown: {
      days,
      dayFactor,
      bplFactor,
      urgencyFactor,
    },
  };
}

export function getPriorityBand(score: number) {
  if (score > 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
