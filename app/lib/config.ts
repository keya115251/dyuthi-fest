export const PAYMENT_REQUIRED = true;

// The OCR verification webhook/pipeline isn't reliable yet, so hide its
// output (Payment Match, Needs Review, ID Match Score) from the admin
// dashboard until it's actually working. Flip to true to re-enable.
export const SHOW_OCR_VERIFICATION = false;

// Confirmation emails go here (not to registrants) until a verified
// sending domain is set up in Resend. See app/api/send-confirmation/route.ts.
export const TEAM_NOTIFICATION_EMAIL = "dyuthi.cbit@gmail.com";

// 10% off Aangikam (Classical Dance) and 3T's (Hip-Hop Crew) registration,
// 9:00 AM to midnight IST on August 26, 2026 (IST is UTC+5:30).
export const FLASH_SALE = {
  startsAt: "2026-08-26T03:30:00.000Z", // 9:00 AM IST
  endsAt: "2026-08-26T18:30:00.000Z", // midnight IST (start of Aug 27 IST)
  discountPercent: 10,
  eventSlugs: ["classical-dance", "hip-hop-dance"],
};

// In non-production environments, the countdown is simulated so the sale
// can be previewed locally without waiting for the real date/time.
export const FLASH_SALE_DEV_PREVIEW = process.env.NODE_ENV !== "production";

// Not publicly launched yet - flip to true (and deploy) to open the Solo
// category for 3T's. Always visible in development so it can be tested
// locally regardless of this flag.
export const SOLO_3TS_ENABLED = true;

// Hard deadlines for competition entries. Each competition closes on its own
// schedule. Does NOT apply to 3T's Solo or Round 2 (which is gated
// separately by band selection status).
export const AANGIKAM_CLOSES_AT = "2026-09-09T18:29:59.000Z"; 
export const HIPHOP_CREW_CLOSES_AT = "2026-09-10T06:29:00.000Z"; // 11:59:59 PM IST, Sept 9 2026 - unchanged
export const BAND_ROUND1_CLOSES_AT = "2026-09-09T18:29:59.000Z"; // 11:59:59 PM IST, Sept 9 2026 - unchanged
