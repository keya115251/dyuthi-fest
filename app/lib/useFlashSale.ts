"use client";

import { useEffect, useRef, useState } from "react";
import { FLASH_SALE, FLASH_SALE_DEV_PREVIEW } from "@/app/lib/config";

const DEV_PREVIEW_DURATION_MS = 2 * 60 * 1000;

type FlashSaleState = {
  isActive: boolean;
  timeRemainingMs: number | null;
  hasEnded: boolean;
};

export function useFlashSale(eventSlug: string): FlashSaleState {
  const devEndsAtRef = useRef<number | null>(null);
  if (FLASH_SALE_DEV_PREVIEW && devEndsAtRef.current === null) {
    devEndsAtRef.current = Date.now() + DEV_PREVIEW_DURATION_MS;
  }

  const eligible = FLASH_SALE.eventSlugs.includes(eventSlug);

  const compute = (): FlashSaleState => {
    if (!eligible) {
      return { isActive: false, timeRemainingMs: null, hasEnded: false };
    }

    const now = Date.now();

    if (FLASH_SALE_DEV_PREVIEW) {
      const endsAt = devEndsAtRef.current as number;
      const remaining = endsAt - now;
      return {
        isActive: remaining > 0,
        timeRemainingMs: Math.max(remaining, 0),
        hasEnded: remaining <= 0,
      };
    }

    const startsAt = new Date(FLASH_SALE.startsAt).getTime();
    const endsAt = new Date(FLASH_SALE.endsAt).getTime();

    if (now < startsAt) {
      return { isActive: false, timeRemainingMs: null, hasEnded: false };
    }

    const remaining = endsAt - now;
    return {
      isActive: remaining > 0,
      timeRemainingMs: Math.max(remaining, 0),
      hasEnded: remaining <= 0,
    };
  };

  const [state, setState] = useState<FlashSaleState>(compute);

  useEffect(() => {
    setState(compute());
    const interval = setInterval(() => {
      setState(compute());
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  return state;
}
