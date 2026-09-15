"use client";

import { useId, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import PhoneInput from "@/app/components/PhoneInput";
import Waves from "@/app/components/Waves"
import TransitionLink from "@/app/components/TransitionLink";
import {
  PAYMENT_REQUIRED,
  TEAM_NOTIFICATION_EMAIL,
  AUDIENCE_CLOSES_AT,
} from "@/app/lib/config";
import { useRegistrationOpen } from "@/app/lib/useRegistrationOpen";

const AUDIENCE_PRICE = 100;

export default function AudienceRegisterForm() {
  const registrationOpen = useRegistrationOpen(AUDIENCE_CLOSES_AT);
  const [step, setStep] = useState<"details" | "payment" | "done">("details");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [payeeName, setPayeeName] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const paymentScreenshotId = useId();

  const canProceedToPayment =
    name.trim() !== "" &&
    age.trim() !== "" &&
    institution.trim() !== "" &&
    phone.length === 10 &&
    email.trim() !== "";

  async function handleSubmit() {
    if (PAYMENT_REQUIRED && !paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data: registration, error: regError } = await supabase
        .from("audience_registrations")
        .insert({
          name,
          age: parseInt(age),
          institution,
          phone,
          email,
          amount_paid: AUDIENCE_PRICE,
          payment_pending: !paymentScreenshot,
          payee_name: payeeName,
          payee_phone: payeePhone,
          utr_reference: utrReference,
        })
        .select()
        .single();

      if (regError || !registration) throw regError;

      if (paymentScreenshot) {
        const paymentPath = `${registration.id}/payment-screenshot-${paymentScreenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from("registration-uploads")
          .upload(paymentPath, paymentScreenshot);

        if (uploadError) throw uploadError;

        await supabase
          .from("audience_registrations")
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
            eventName: "Dyuthi",
            // TODO: confirm whether an audience pass covers one day or both days —
            // if it's day-specific, this should reflect the registrant's actual day, not a range.
            eventDate: "September 18-19, 2026",
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

  if (!registrationOpen && step !== "done") {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-text-primary mb-4">
            Registration Closed
          </h1>
          <p className="text-text-muted">
            Audience registration for Dyuthi closed on September 15, 2026.
            The deadline has passed and entries are no longer being accepted.
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
          <p className="text-text-muted">Audience pass — {name}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      <div className="pointer-events-none">
  <Waves
      lineColor="rgba(255,255,255,0.1
      )"
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
          Register — Audience
        </h1>

        <div className="rounded-2xl border border-white/10 bg-bg-surface px-4 py-3 mb-6">
          <p className="text-text-muted text-sm">
            CBIT students enter free, just bring your college ID.
          </p>
        </div>

        <p className="text-text-muted mb-10">
          {step === "details" && "Your details"}
          {step === "payment" && "Payment"}
        </p>

        {step === "details" && (
          <>
            <div className="space-y-4 mb-8">
              <Input label="Name" value={name} onChange={setName} />
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={setAge}
              />
              <Input
                label="Institution"
                value={institution}
                onChange={setInstitution}
                hint='Graduated or no current institution? Enter "N/A".'
              />
              <PhoneInput value={phone} onChange={setPhone} />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
              />
            </div>

            <button
              onClick={() => setStep("payment")}
              disabled={!canProceedToPayment}
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
                    ₹{AUDIENCE_PRICE}
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
                  <Input label="Payee Name" value={payeeName} onChange={setPayeeName} />
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
                  <label htmlFor={paymentScreenshotId} className="block text-text-muted text-sm mb-1">
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
                  We&apos;ll send you a payment link via email and WhatsApp next week to complete your registration. No action needed from you right now.
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
      <label htmlFor={inputId} className="block text-text-muted text-sm mb-1">{label}</label>
      {hint && <p className="text-text-muted text-xs mb-1">{hint}</p>}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
      />
    </div>
  );
}
