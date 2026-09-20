"use client";

import { useId, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import PhoneInput from "@/app/components/PhoneInput";
import Waves from "@/app/components/Waves";
import TransitionLink from "@/app/components/TransitionLink";
import {
  PAYMENT_REQUIRED,
  TEAM_NOTIFICATION_EMAIL,
  WORKSHOPS_CLOSED,
} from "@/app/lib/config";

const WORKSHOP_SLUG = "studio-to-stage";
const FLAT_PRICE = 200;

export default function WorkshopRegisterForm() {
  const [step, setStep] = useState<"details" | "payment" | "done">("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [idProof, setIdProof] = useState<File | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<
    number | null
  >(null);
  const [couponPreviewError, setCouponPreviewError] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [payeeName, setPayeeName] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const paymentScreenshotId = useId();
  const idProofId = useId();

  const detailsValid =
    name.trim() !== "" &&
    phone.length === 10 &&
    email.trim() !== "" &&
    institution.trim() !== "" &&
    idProof !== null;

  const effectiveDiscountPercent = couponDiscountPercent ?? 0;
  const discountedPrice = Math.round(
    FLAT_PRICE * (1 - effectiveDiscountPercent / 100)
  );

  // A coupon just needs to exist to apply its discount - no use-count
  // tracking, so this lookup is the only check needed.
  async function checkCoupon() {
    const code = couponInput.trim();
    setCouponPreviewError("");
    setCouponDiscountPercent(null);
    if (!code) return;

    setCouponChecking(true);
    const { data } = await supabase
      .from("coupons")
      .select("discount_percent")
      .eq("code", code)
      .maybeSingle();

    if (data) {
      setCouponDiscountPercent(data.discount_percent);
    } else {
      setCouponPreviewError("Coupon not found");
    }
    setCouponChecking(false);
  }

  async function handleSubmit() {
    if (PAYMENT_REQUIRED && !paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }
    if (!idProof) {
      setError("Something went wrong. Please start again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const enteredCode = couponInput.trim();
      const amountPaid = discountedPrice;
      const couponCodeUsed = enteredCode || null;

      const { data: registration, error: regError } = await supabase
        .from("workshop_registrations")
        .insert({
          workshop_slug: WORKSHOP_SLUG,
          name,
          phone,
          email,
          institution,
          tier: null,
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
            eventName: "Studio to Stage Workshop with Chirag Samtani",
            eventDate: "September 18, 2026",
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

  if (WORKSHOPS_CLOSED && step !== "done") {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-text-primary mb-4">
            Registration Closed
          </h1>
          <p className="text-text-muted">
            Registration for the Studio to Stage Workshop has closed. The
            deadline has passed and entries are no longer being accepted.
          </p>
          <TransitionLink
            href="/"
            className="cursor-target inline-block mt-6 text-thermal-accent hover:underline"
          >
            ← Back to Home
          </TransitionLink>
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
            Studio to Stage Workshop with Chirag Samtani — {name}
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
          Register — Studio to Stage Workshop
        </h1>
        <p className="text-text-muted mb-1">Hosted by Chirag Samtani</p>
        <p className="text-text-muted mb-10">
          September 18, 2026 · 1 – 4 PM
        </p>

        {step === "details" && (
          <>
            <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
              <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
                Price
              </p>
              <p className="text-text-primary text-3xl font-semibold">
                ₹{discountedPrice}
                {couponDiscountPercent !== null && (
                  <span className="text-text-muted text-lg font-normal line-through ml-2">
                    ₹{FLAT_PRICE}
                  </span>
                )}
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
              <Input
                label="Coupon Code (optional)"
                value={couponInput}
                onChange={(v) => {
                  setCouponInput(v);
                  setCouponDiscountPercent(null);
                  setCouponPreviewError("");
                }}
                onBlur={checkCoupon}
                hint="Have a coupon from an earlier Dyuthi registration? Enter it for a discount."
              />
              {couponChecking && (
                <p className="text-text-muted text-xs -mt-3">
                  Checking coupon…
                </p>
              )}
              {!couponChecking && couponDiscountPercent !== null && (
                <p className="text-thermal-accent text-xs -mt-3">
                  {couponDiscountPercent}% off will be applied.
                </p>
              )}
              {!couponChecking && couponPreviewError && (
                <p className="text-text-muted text-xs -mt-3">
                  {couponPreviewError}
                </p>
              )}

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
              onClick={() => setStep("payment")}
              disabled={!detailsValid}
              className="w-full px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </>
        )}

        {step === "payment" && (
          <>
            {PAYMENT_REQUIRED ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
                  <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
                    Total Amount
                  </p>
                  <p className="text-text-primary text-3xl font-semibold">
                    ₹{discountedPrice}
                    {couponDiscountPercent !== null && (
                      <span className="text-text-muted text-lg font-normal line-through ml-2">
                        ₹{FLAT_PRICE}
                      </span>
                    )}
                  </p>
                  {couponDiscountPercent !== null && (
                    <p className="text-thermal-accent text-sm mt-1">
                      {couponDiscountPercent}% coupon discount applied
                    </p>
                  )}
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
  onBlur,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
        className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
      />
    </div>
  );
}
