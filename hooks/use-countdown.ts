"use client";

import { useEffect, useMemo, useState } from "react";

export function useCountdown(targetDate: Date) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const diff = targetDate.getTime() - now.getTime();
    const total = Math.max(0, diff);
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    return {
      isExpired: total <= 0,
      text: `${hours}h ${minutes}m ${seconds}s`,
    };
  }, [now, targetDate]);
}
