import { REGISTRATION_CLOSES_AT } from "@/app/lib/config";

/**
 * Whether competition registration is still open, i.e. the current time is
 * before REGISTRATION_CLOSES_AT.
 *
 * Named `use*` for call-site consistency with useFlashSale, but it's a plain
 * check with no state or timer - unlike the flash-sale countdown, the closed
 * screen doesn't need to swap in the instant the deadline ticks past. A
 * refresh after the deadline is enough.
 */
export function useRegistrationOpen(): boolean {
  return Date.now() < new Date(REGISTRATION_CLOSES_AT).getTime();
}
