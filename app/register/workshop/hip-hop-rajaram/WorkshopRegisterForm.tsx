"use client";

import { useEffect, useId, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import PhoneInput from "@/app/components/PhoneInput";
import Waves from "@/app/components/Waves";
import { PAYMENT_REQUIRED, TEAM_NOTIFICATION_EMAIL } from "@/app/lib/config";

// Slug the workshop_slots / workshop_registrations tables key off of. Note this
// differs from the route segment (hip-hop-rajaram).
const WORKSHOP_SLUG = "hip-hop-workshop-rajaram";
const TOTAL_ONLINE_SLOTS = 30;
const TIER_1_LIMIT = 15;
const TIER_1_PRICE = 599;
const TIER_2_PRICE = 699;
const ON_SPOT_PRICE = 799;

// Parsed from the claim_workshop_slot RPC row, whose columns are
// out_slot_number / out_tier / out_price.
type ClaimedSlot = { tier: string | number; price: number };

function readSlot(data: unknown): ClaimedSlot | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const price = Number(r.out_price);
  if (Number.isNaN(price)) return null;
  const tier = (r.out_tier ?? "") as string | number;
  return { tier, price };
}

// Shape returned by the redeem_coupon RPC: { valid, discount_percent }.
function readRedemption(data: unknown): {
  valid: boolean;
  discountPercent: number;
} {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    return { valid: false, discountPercent: 0 };
  }
  const r = row as Record<string, unknown>;
  return {
    valid: r.valid === true,
    discountPercent: Number(r.discount_percent ?? 0) || 0,
  };
}

export default function WorkshopRegisterForm() {
  const [step, setStep] = useState<"details" | "payment" | "done">("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [idProof, setIdProof] = useState<File | null>(null);

  // null = still loading the count
  const [slotsClaimed, setSlotsClaimed] = useState<number | null>(null);
  const [regId, setRegId] = useState<string | null>(null);
  const [claimedSlot, setClaimedSlot] = useState<ClaimedSlot | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [payeeName, setPayeeName] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const paymentScreenshotId = useId();
  const idProofId = useId();

  useEffect(() => {
    supabase
      .from("workshop_slots")
      .select("*", { count: "exact", head: true })
      .eq("workshop_slug", WORKSHOP_SLUG)
      .eq("claimed", true)
      .then(({ count }) => setSlotsClaimed(count ?? 0));
  }, []);

  const detailsValid =
    name.trim() !== "" &&
    phone.length === 10 &&
    email.trim() !== "" &&
    institution.trim() !== "" &&
    idProof !== null;

  // Tier the next registration lands in, estimated from the live count so we
  // can show a price before they start. The authoritative price comes back
  // from the RPC when the slot is actually claimed.
  const estimatedPrice =
    slotsClaimed !== null && slotsClaimed < TIER_1_LIMIT
      ? TIER_1_PRICE
      : TIER_2_PRICE;

  // A coupon typed in - the discount itself is only confirmed by redeem_coupon
  // at submission, so this just drives the "will be applied" hint, not a price.
  const couponEntered = couponInput.trim() !== "";

  async function handleClaimAndProceed() {
    // Slot already reserved (e.g. user went Back from payment) - don't claim
    // a second one.
    if (claimedSlot) {
      setStep("payment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const newRegId = crypto.randomUUID();
      const { data, error: rpcError } = await supabase.rpc(
        "claim_workshop_slot",
        { p_workshop_slug: WORKSHOP_SLUG, reg_id: newRegId }
      );

      if (rpcError) throw rpcError;

      const slot = readSlot(data);
      if (!slot) {
        setSlotsClaimed(TOTAL_ONLINE_SLOTS);
        setError(
          "Sorry, online spots have just been filled - please register on the spot for ₹799 at the venue."
        );
        return;
      }

      setRegId(newRegId);
      setClaimedSlot(slot);
      setStep("payment");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (PAYMENT_REQUIRED && !paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }
    if (!regId || !claimedSlot || !idProof) {
      setError("Something went wrong. Please start again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const enteredCode = couponInput.trim();
      let amountPaid = claimedSlot.price;
      let couponCodeUsed: string | null = null;

      // Redeem the coupon exactly once, here, right before the insert - every
      // successful redeem_coupon call permanently consumes one of its uses, so
      // it must not run during the price preview or on keystrokes.
      if (enteredCode) {
        const { data: redeemData, error: redeemError } = await supabase.rpc(
          "redeem_coupon",
          { p_code: enteredCode }
        );
        if (redeemError) throw redeemError;

        const { valid, discountPercent } = readRedemption(redeemData);
        if (!valid) {
          setError(
            "This coupon code is invalid or has already been fully used."
          );
          return;
        }

        amountPaid = Math.round(
          claimedSlot.price * (1 - discountPercent / 100)
        );
        couponCodeUsed = enteredCode;
      }

      const { data: registration, error: regError } = await supabase
        .from("workshop_registrations")
        .insert({
          id: regId,
          workshop_slug: WORKSHOP_SLUG,
          name,
          phone,
          email,
          institution,
          tier: claimedSlot.tier,
          amount_paid: amountPaid,
          coupon_code_used: couponCodeUsed,
          payment_pending: !paymentScreenshot,
          payee_name: payeeName,
          payee_phone: payeePhone,
          utr_reference: utrReference,
        })
        .select()
        .single();

      if (regError || !registration) throw regError;

      const idProofPath = `${registration.id}/id-proof-${idProof.name}`;
      const { error: idUploadError } = await supabase.storage
        .from("registration-uploads")
        .upload(idProofPath, idProof);

      if (idUploadError) throw idUploadError;

      await supabase
        .from("workshop_registrations")
        .update({ id_proof_url: idProofPath })
        .eq("id", registration.id);

      if (paymentScreenshot) {
        const paymentPath = `${registration.id}/payment-screenshot-${paymentScreenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from("registration-uploads")
          .upload(paymentPath, paymentScreenshot);

        if (uploadError) throw uploadError;

        await supabase
          .from("workshop_registrations")
          .update({ payment_screenshot_url: paymentPath })
          .eq("id", registration.id);
      }

      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: TEAM_NOTIFICATION_EMAIL,
            registrantName: name,
            registrantEmail: email,
            registrantPhone: phone,
            eventName: "Hip-Hop Dance Workshop with Rajaram",
            eventDate: "September 19, 2026",
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }

      setStep("done");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ----- loading / full screens (no form) -----

  if (slotsClaimed === null) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <p className="text-text-muted">Checking availability…</p>
      </main>
    );
  }

  if (step !== "done" && slotsClaimed >= TOTAL_ONLINE_SLOTS) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-text-primary mb-4">
            Online Registration Full
          </h1>
          <p className="text-text-muted">
            Online registration is full. You can still register on the spot for
            ₹{ON_SPOT_PRICE} at the venue on September 19.
          </p>
        </div>
      </main>
    );
  }

  if (step === "done") {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-text-primary mb-2">
            You&apos;re registered!
          </h1>
          <p className="text-text-muted">
            Hip-Hop Dance Workshop with Rajaram — {name}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      <div className="pointer-events-none">
        <Waves
          lineColor="rgba(255,255,255,0.1)"
          backgroundColor="transparent"
          waveSpeedX={0.015}
          waveSpeedY={0.008}
          waveAmpX={30}
          waveAmpY={15}
          friction={0.9}
          tension={0.008}
          maxCursorMove={100}
          xGap={14}
          yGap={34}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl text-text-primary mb-2">
          Register — Hip-Hop Dance Workshop
        </h1>
        <p className="text-text-muted mb-1">Rajaram · BFAB Dance Crew</p>
        <p className="text-text-muted mb-10">September 19, 2026 · 3 hours</p>

        {step === "details" && (
          <>
            <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
              <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
                Your Price
              </p>
              <p className="text-text-primary text-3xl font-semibold">
                ₹{estimatedPrice}
              </p>
              <p className="text-text-muted text-sm mt-1">
                {slotsClaimed} / {TOTAL_ONLINE_SLOTS} online spots taken ·{" "}
                {slotsClaimed < TIER_1_LIMIT
                  ? `first ${TIER_1_LIMIT} pay ₹${TIER_1_PRICE}, next ${TIER_1_LIMIT} pay ₹${TIER_2_PRICE}`
                  : `₹${TIER_2_PRICE} tier`}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <Input label="Name" value={name} onChange={setName} />
              <PhoneInput value={phone} onChange={setPhone} />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Institution"
                value={institution}
                onChange={setInstitution}
                hint='Graduated or no current institution? Enter "N/A".'
              />

              <div>
                <label
                  htmlFor={idProofId}
                  className="block text-text-muted text-sm mb-1"
                >
                  ID Proof (PDF or PNG)
                </label>
                <label className="flex items-center justify-between w-full rounded-lg bg-bg-surface border border-dashed border-white/20 px-4 py-3 cursor-pointer hover:border-thermal-accent transition-colors">
                  <span className="text-text-muted text-sm truncate">
                    {idProof ? idProof.name : "Click to upload file"}
                  </span>
                  <span className="text-thermal-accent text-sm flex-shrink-0 ml-3">
                    {idProof ? "Change" : "Upload"}
                  </span>
                  <input
                    id={idProofId}
                    type="file"
                    accept="application/pdf,image/png"
                    onChange={(e) => setIdProof(e.target.files?.[0] || null)}
                    className="hidden cursor-target"
                  />
                </label>
              </div>
            </div>

            {error && (
              <p className="text-thermal-accent text-sm mb-4">{error}</p>
            )}

            <button
              onClick={handleClaimAndProceed}
              disabled={!detailsValid || submitting}
              className="w-full px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70 disabled:cursor-not-allowed"
            >
              {submitting ? "Reserving your spot…" : "Continue to Payment"}
            </button>
          </>
        )}

        {step === "payment" && claimedSlot && (
          <>
            {PAYMENT_REQUIRED ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
                  <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
                    Total Amount
                  </p>
                  <p className="text-text-primary text-3xl font-semibold">
                    ₹{claimedSlot.price}
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    Tier {String(claimedSlot.tier)} price
                    {couponEntered && (
                      <span className="text-thermal-accent ml-2">
                        A valid coupon is applied at submission and reduces this.
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-bg-surface p-4 mb-6 flex flex-col items-center">
                  <p className="text-text-muted text-sm mb-4">Scan to pay</p>
                  <img
                    src="/payment-qr.png"
                    alt="Payment QR code"
                    className="w-72 sm:w-80 h-auto rounded-lg object-contain"
                  />
                </div>

                <div className="space-y-4 mb-6">
                  <Input
                    label="Coupon Code (optional)"
                    value={couponInput}
                    onChange={setCouponInput}
                    hint="Have a coupon from an earlier Dyuthi registration? Enter it for 40% off."
                  />
                  <Input
                    label="Payee Name"
                    value={payeeName}
                    onChange={setPayeeName}
                  />
                  <Input
                    label="Payee Mobile Number"
                    type="tel"
                    value={payeePhone}
                    onChange={setPayeePhone}
                  />
                  <Input
                    label="UTR / Transaction Reference Number"
                    value={utrReference}
                    onChange={setUtrReference}
                    hint="Found in your UPI app's payment confirmation or transaction history."
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor={paymentScreenshotId}
                    className="block text-text-muted text-sm mb-1"
                  >
                    Payment Screenshot
                  </label>
                  <label className="flex items-center justify-between w-full rounded-lg bg-bg-surface border border-dashed border-white/20 px-4 py-3 cursor-pointer hover:border-thermal-accent transition-colors">
                    <span className="text-text-muted text-sm truncate">
                      {paymentScreenshot
                        ? paymentScreenshot.name
                        : "Click to upload screenshot"}
                    </span>
                    <span className="text-thermal-accent text-sm flex-shrink-0 ml-3">
                      {paymentScreenshot ? "Change" : "Upload"}
                    </span>
                    <input
                      id={paymentScreenshotId}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setPaymentScreenshot(e.target.files?.[0] || null)
                      }
                      className="hidden cursor-target"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
                <h2 className="text-text-primary text-xl font-semibold mb-2">
                  Payment link coming soon
                </h2>
                <p className="text-text-muted text-sm">
                  We&apos;ll send you a payment link via email and WhatsApp next
                  week to complete your registration. No action needed from you
                  right now.
                </p>
              </div>
            )}

            {error && (
              <p className="text-thermal-accent text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep("details")}
                className="flex-1 px-8 py-3 rounded-full border border-white/10 text-text-primary hover:border-thermal-accent transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (PAYMENT_REQUIRED &&
                    (!paymentScreenshot ||
                      !payeeName ||
                      !payeePhone ||
                      !utrReference))
                }
                className="flex-1 px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70"
              >
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  const inputId = useId();
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-text-muted text-sm mb-1"
      >
        {label}
      </label>
      {hint && <p className="text-text-muted text-xs mb-1">{hint}</p>}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
      />
    </div>
  );
}
