"use client";

import { useId, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import type { FestEvent } from "@/app/data/events";
import Waves from "@/app/components/Waves";
import TransitionLink from "@/app/components/TransitionLink";
import {
  PAYMENT_REQUIRED,
  TEAM_NOTIFICATION_EMAIL,
  AANGIKAM_CLOSES_AT,
} from "@/app/lib/config";
import { useFlashSale } from "@/app/lib/useFlashSale";
import { useRegistrationOpen } from "@/app/lib/useRegistrationOpen";
import CountdownTimer from "@/app/components/CountdownTimer";

type Participant = {
  name: string;
  contact: string;
  email: string;
  age: string;
  institution: string;
  sameAsHead: boolean;
  idProof: File | null;
};

const emptyParticipant = (): Participant => ({
  name: "",
  contact: "",
  email: "",
  age: "",
  institution: "",
  sameAsHead: false,
  idProof: null,
});

const DANCE_FORMS = [
  "Kuchipudi",
  "Bharatanatyam",
  "Kathak",
  "Kathakali",
  "Mohiniyattam",
  "Odissi",
  "Manipuri",
  "Sattriya",
  "Semi-classical",
  "Fusion",
];

const SOLO_PRICE = 850;
const GROUP_PRICE_PER_HEAD = 500;
const MAX_GROUP_SIZE = 10;

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function DanceRegisterForm({ event }: { event: FestEvent }) {
  const flashSale = useFlashSale(event.slug);
  const registrationOpen = useRegistrationOpen(AANGIKAM_CLOSES_AT);

  const [step, setStep] = useState<
    "details" | "participants" | "payment" | "done"
  >("details");

  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [ageGroup, setAgeGroup] = useState<"junior" | "senior">("junior");
  const [danceForm, setDanceForm] = useState(DANCE_FORMS[0]);
  const [performanceType, setPerformanceType] = useState<"solo" | "group">(
    "solo"
  );
  const danceFormId = useId();

  const [participants, setParticipants] = useState<Participant[]>([
    emptyParticipant(),
  ]);
  const [openIndex, setOpenIndex] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(
    null
  );
  const [payeeName, setPayeeName] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const paymentScreenshotId = useId();

  function updateParticipant(
    index: number,
    field: keyof Participant,
    value: string | File | null | boolean
  ) {
    setParticipants((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, [field]: value };
        if (field === "sameAsHead" && value === true) {
          updated.institution = prev[0].institution;
        }
        return updated;
      })
    );
  }

  function addParticipant() {
    if (participants.length >= MAX_GROUP_SIZE) return;
    setParticipants((prev) => [...prev, emptyParticipant()]);
    setOpenIndex(participants.length);
  }

  function removeParticipant(index: number) {
    if (participants.length <= 1) return;
    setParticipants((prev) => prev.filter((_, i) => i !== index));
    setOpenIndex(0);
  }

  const canProceedToParticipants = city && stateName;

  const canProceedToPayment = participants.every(
    (p) =>
      p.name && p.contact && p.email && p.age && p.institution && p.idProof
  );

  const soloPrice = flashSale.isActive
    ? Math.round(SOLO_PRICE * 0.9)
    : SOLO_PRICE;
  const groupPricePerHead = flashSale.isActive
    ? Math.round(GROUP_PRICE_PER_HEAD * 0.9)
    : GROUP_PRICE_PER_HEAD;

  const total =
    performanceType === "solo"
      ? soloPrice
      : participants.length * groupPricePerHead;

  async function uploadFile(file: File, path: string) {
    const { error: uploadError } = await supabase.storage
      .from("registration-uploads")
      .upload(path, file);
    if (uploadError) throw uploadError;
    return path;
  }

  async function handleSubmit() {
    if (PAYMENT_REQUIRED && !paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data: registration, error: regError } = await supabase
        .from("dance_registrations")
        .insert({
          performance_type: performanceType,
          dance_form: danceForm,
          age_group: ageGroup,
          city,
          state: stateName,
          email: participants[0].email,
          participant_count: participants.length,
          amount_paid: total,
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
        await uploadFile(paymentScreenshot, paymentPath);
        await supabase
          .from("dance_registrations")
          .update({ payment_screenshot_url: paymentPath })
          .eq("id", registration.id);
      }

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (!p.idProof) continue;

        const idPath = `${registration.id}/participant-${i}-id-${p.idProof.name}`;
        await uploadFile(p.idProof, idPath);

        const { error: participantError } = await supabase
          .from("dance_participants")
          .insert({
            registration_id: registration.id,
            name: p.name,
            contact: p.contact || null,
            email: p.email || null,
            age: p.age ? parseInt(p.age) : null,
            institution: p.institution,
            id_proof_url: idPath,
            is_head: i === 0,
          });

        if (participantError) throw participantError;
      }

      const newCouponCode = generateCouponCode();
      await supabase.from("coupons").insert({
        code: newCouponCode,
        source_table: "dance_registrations",
        source_registration_id: registration.id,
        max_uses: participants.length,
        discount_percent: 40,
      });
      await supabase
        .from("dance_registrations")
        .update({ coupon_code: newCouponCode })
        .eq("id", registration.id);
      setCouponCode(newCouponCode);

      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: TEAM_NOTIFICATION_EMAIL,
            registrantName: participants[0].name,
            registrantEmail: participants[0].email,
            registrantPhone: participants[0].contact,
            eventName: event.title,
            eventDate: "September 18, 2026",
            couponCode: newCouponCode,
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
            Registration for {event.name} closed on September 9, 2026. The
            deadline has passed and entries are no longer being accepted.
          </p>
          <TransitionLink
            href={`/events/${event.slug}`}
            className="cursor-target inline-block mt-6 text-thermal-accent hover:underline"
          >
            ← Back to {event.title}
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
            {event.name} — {performanceType === "solo" ? "Solo" : `Group of ${participants.length}`}
          </p>
          {couponCode && (
            <div className="mt-6 inline-block rounded-xl border border-thermal-accent/40 bg-thermal-accent/10 px-6 py-4">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
                Your Coupon Code
              </p>
              <p className="text-thermal-accent text-2xl font-mono font-bold tracking-widest">
                {couponCode}
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
    <Waves
      lineColor="rgba(245,198,224,0.3)"
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
          Register — {event.title}
        </h1>
        <p className="text-text-muted mb-10">
          {step === "details" && "Performance details"}
          {step === "participants" &&
            (performanceType === "solo" ? "Your details" : "Group members")}
          {step === "payment" && "Payment"}
        </p>

        {step === "details" && (
          <>
            {flashSale.isActive && (
              <div className="rounded-xl border border-thermal-accent bg-thermal-accent/10 p-4 mb-8">
                <p className="text-thermal-accent font-medium text-sm">
                  ✨ Flash Sale: 10% off, ends in{" "}
                  <CountdownTimer timeRemainingMs={flashSale.timeRemainingMs} />
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <Input label="City" value={city} onChange={setCity} />
              <Input label="State" value={stateName} onChange={setStateName} />

              <fieldset>
                <legend className="block text-text-muted text-sm mb-2">
                  Age Group
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={ageGroup === "junior"}
                      onChange={() => setAgeGroup("junior")}
                      className="cursor-target w-5 h-5"
                    />
                    Junior (up to 10th grade)
                  </label>
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={ageGroup === "senior"}
                      onChange={() => setAgeGroup("senior")}
                      className="cursor-target w-5 h-5"
                    />
                    Senior (11th grade onward)
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor={danceFormId} className="block text-text-muted text-sm mb-1">
                  Classical Dance Form
                </label>
                <select
                  id={danceFormId}
                  value={danceForm}
                  onChange={(e) => setDanceForm(e.target.value)}
                  className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
                >
                  {DANCE_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="block text-text-muted text-sm mb-2">
                  Performance
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={performanceType === "solo"}
                      onChange={() => {
                        setPerformanceType("solo");
                        setParticipants([emptyParticipant()]);
                      }}
                      className="cursor-target w-5 h-5"
                    />
                    Solo
                  </label>
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={performanceType === "group"}
                      onChange={() => setPerformanceType("group")}
                      className="cursor-target w-5 h-5"
                    />
                    Group
                  </label>
                </div>
              </fieldset>
            </div>

            <button
              onClick={() => setStep("participants")}
              disabled={!canProceedToParticipants}
              className="w-full px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        )}

        {step === "participants" && (
          <>
            <div className="space-y-4">
              {participants.map((p, i) => (
                <ParticipantCard
                  key={i}
                  index={i}
                  participant={p}
                  isOpen={openIndex === i}
                  isHead={i === 0}
                  isSolo={performanceType === "solo"}
                  onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                  onChange={(field, value) => updateParticipant(i, field, value)}
                  onRemove={() => removeParticipant(i)}
                  canRemove={participants.length > 1}
                />
              ))}
            </div>

            {performanceType === "group" && participants.length < MAX_GROUP_SIZE && (
              <button
                onClick={addParticipant}
                className="mt-4 w-full rounded-xl border border-dashed border-white/20 py-3 text-text-muted hover:border-thermal-accent hover:text-thermal-accent transition-colors"
              >
                + Add Member
              </button>
            )}

            {performanceType === "group" && (
              <p className="text-text-muted text-sm mt-4">
                {participants.length} / {MAX_GROUP_SIZE} members
              </p>
            )}

            <button
              onClick={() => setStep("payment")}
              disabled={!canProceedToPayment}
              className="w-full mt-8 px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </>
        )}

        {step === "payment" && (
          <>
            {flashSale.isActive && (
              <div className="rounded-xl border border-thermal-accent bg-thermal-accent/10 p-4 mb-6">
                <p className="text-thermal-accent font-medium text-sm">
                  ✨ Flash Sale: 10% off, ends in{" "}
                  <CountdownTimer timeRemainingMs={flashSale.timeRemainingMs} />
                </p>
              </div>
            )}

            {PAYMENT_REQUIRED ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 mb-6">
                  <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
                    Total Amount
                  </p>
                  <p className="text-text-primary text-3xl font-semibold">
                    ₹{total}
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    {performanceType === "solo"
                      ? `₹${soloPrice}`
                      : `${participants.length} × ₹${groupPricePerHead}`}
                    {flashSale.isActive && (
                      <span className="text-thermal-accent ml-2">
                        (10% off applied)
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

            {error && <p className="text-thermal-accent text-sm mb-4">{error}</p>}

            <div className="flex gap-4">
              <button
                onClick={() => setStep("participants")}
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

function ParticipantCard({
  index,
  participant,
  isOpen,
  isHead,
  isSolo,
  onToggle,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  participant: Participant;
  isOpen: boolean;
  isHead: boolean;
  isSolo: boolean;
  onToggle: () => void;
  onChange: (
    field: keyof Participant,
    value: string | File | null | boolean
  ) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isFilled =
    participant.name &&
    participant.contact &&
    participant.email &&
    participant.age &&
    participant.institution &&
    participant.idProof;

  const institutionId = useId();
  const idProofId = useId();

  return (
    <div className="rounded-xl border border-white/10 bg-bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-text-primary font-medium">
          {participant.name || (isSolo ? "Your details" : `Member ${index + 1}`)}
          {isHead && !isSolo && (
            <span className="text-thermal-accent text-xs ml-2 uppercase">
              Group Head
            </span>
          )}
        </span>
        <span className="text-text-muted text-sm">
          {isFilled ? "✓" : ""} {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-4">
          <Input
            label="Name"
            value={participant.name}
            onChange={(v) => onChange("name", v)}
          />

          <Input
            label="Contact"
            type="tel"
            value={participant.contact}
            onChange={(v) => onChange("contact", v)}
          />
          <Input
            label="Email"
            type="email"
            value={participant.email}
            onChange={(v) => onChange("email", v)}
          />
          <Input
            label="Age"
            type="number"
            value={participant.age}
            onChange={(v) => onChange("age", v)}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={institutionId} className="block text-text-muted text-sm">
                Institution
              </label>
              {!isHead && !isSolo && (
                <label className="flex items-center gap-2 text-text-muted text-xs">
                  <input
                    type="checkbox"
                    checked={participant.sameAsHead}
                    onChange={(e) => onChange("sameAsHead", e.target.checked)}
                    className="cursor-target w-5 h-5"
                  />
                  Same as Group Leader
                </label>
              )}
            </div>
            <p className="text-text-muted text-xs mb-1">
              Graduated or no current institution? Enter &quot;N/A&quot;.
            </p>
            <input
              id={institutionId}
              type="text"
              value={participant.institution}
              onChange={(e) => onChange("institution", e.target.value)}
              disabled={!isHead && participant.sameAsHead}
              className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none disabled:bg-thermal-accent/60 disabled:text-bg-base/70"
            />
          </div>

          <div>
            <label htmlFor={idProofId} className="block text-text-muted text-sm mb-1">
              ID Card (PDF or PNG)
            </label>
            <label className="flex items-center justify-between w-full rounded-lg bg-bg-base border border-dashed border-white/20 px-4 py-3 cursor-pointer hover:border-thermal-accent transition-colors">
              <span className="text-text-muted text-sm truncate">
                {participant.idProof
                  ? participant.idProof.name
                  : "Click to upload file"}
              </span>
              <span className="text-thermal-accent text-sm flex-shrink-0 ml-3">
                {participant.idProof ? "Change" : "Upload"}
              </span>
              <input
                id={idProofId}
                type="file"
                accept="application/pdf,image/png"
                onChange={(e) =>
                  onChange("idProof", e.target.files?.[0] || null)
                }
                className="hidden cursor-target"
              />
            </label>
          </div>

          {canRemove && !isSolo && (
            <button
              onClick={onRemove}
              className="text-thermal-accent text-sm hover:underline"
            >
              Remove member
            </button>
          )}
        </div>
      )}
    </div>
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
        className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
      />
    </div>
  );
}