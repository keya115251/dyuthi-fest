"use client";

import { useEffect, useId, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import type { FestEvent } from "@/app/data/events";
import Waves from "@/app/components/Waves";
import TransitionLink from "@/app/components/TransitionLink";
import {
  PAYMENT_REQUIRED,
  TEAM_NOTIFICATION_EMAIL,
  SOLO_3TS_ENABLED,
  HIPHOP_CREW_CLOSES_AT,
} from "@/app/lib/config";
import { useFlashSale } from "@/app/lib/useFlashSale";
import { useRegistrationOpen } from "@/app/lib/useRegistrationOpen";
import CountdownTimer from "@/app/components/CountdownTimer";

type Member = {
  name: string;
  phone: string;
  email: string;
  age: string;
  institution: string;
  sameAsPoc: boolean;
  idProof: File | null;
};

const emptyMember = (): Member => ({
  name: "",
  phone: "",
  email: "",
  age: "",
  institution: "",
  sameAsPoc: false,
  idProof: null,
});

const PRICE_FLAT = 3115;
const SOLO_PRICE = 899;
const SOLO_MAX_SLOTS = 10;
const MIN_MEMBERS = 5;
const MAX_MEMBERS = 25;

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CrewRegisterForm({ event }: { event: FestEvent }) {
  const flashSale = useFlashSale(event.slug);
  const registrationOpen = useRegistrationOpen(HIPHOP_CREW_CLOSES_AT);
  const soloVisible =
    SOLO_3TS_ENABLED || process.env.NODE_ENV !== "production";

  const [step, setStep] = useState<
    "groupInfo" | "members" | "payment" | "done"
  >("groupInfo");

  const [format, setFormat] = useState<"crew" | "solo">("crew");
  const [soloSlotsTaken, setSoloSlotsTaken] = useState<number | null>(null);

  useEffect(() => {
    if (!soloVisible) return;
    supabase
      .from("solo_3ts_slots")
      .select("*", { count: "exact", head: true })
      .eq("claimed", true)
      .then(({ count }) => setSoloSlotsTaken(count ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const soloFull =
    soloSlotsTaken !== null && soloSlotsTaken >= SOLO_MAX_SLOTS;

  const [crewName, setCrewName] = useState("");
  const [category, setCategory] = useState<"open" | "college">("college");
  const [institution, setInstitution] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [performanceDuration, setPerformanceDuration] = useState("");
  const [propsUsed, setPropsUsed] = useState(false);
  const [propsDetails, setPropsDetails] = useState("");
  const [declaration1, setDeclaration1] = useState(false);
  const [declaration2, setDeclaration2] = useState(false);

  const [members, setMembers] = useState<Member[]>([emptyMember()]);
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
  const categoryId = useId();
  const paymentScreenshotId = useId();

  function updateMember(
    index: number,
    field: keyof Member,
    value: string | File | null | boolean
  ) {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const updated = { ...m, [field]: value };
        if (field === "sameAsPoc" && value === true) {
          updated.institution = prev[0].institution;
        }
        return updated;
      })
    );
  }

  function addMember() {
    if (members.length >= MAX_MEMBERS) return;
    setMembers((prev) => [...prev, emptyMember()]);
    setOpenIndex(members.length);
  }

  function removeMember(index: number) {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
    setOpenIndex(0);
  }

  const canProceedToMembers =
    city &&
    stateName &&
    (category === "open" || institution) &&
    (format === "solo" || crewName);

  const price =
    format === "solo"
      ? SOLO_PRICE
      : flashSale.isActive
      ? Math.round(PRICE_FLAT * 0.9)
      : PRICE_FLAT;

  const membersFilled =
    format === "solo"
      ? members.length === 1
      : members.length >= MIN_MEMBERS;

  const canProceedToPayment =
    membersFilled &&
    members.every(
      (m) => m.name && m.phone && m.email && m.age && m.institution && m.idProof
    ) &&
    performanceDuration &&
    (!propsUsed || propsDetails) &&
    declaration1 &&
    declaration2;

  function selectFormat(next: "crew" | "solo") {
    setFormat(next);
    setMembers([emptyMember()]);
    setOpenIndex(0);
  }

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
      let soloRegistrationId: string | undefined;

      if (format === "solo") {
        soloRegistrationId = crypto.randomUUID();
        const { data: slotNumber, error: slotError } = await supabase.rpc(
          "claim_solo_slot",
          { reg_id: soloRegistrationId }
        );
        if (slotError) throw slotError;
        if (slotNumber === null) {
          setError("Sorry, all solo spots have just been filled.");
          setSubmitting(false);
          return;
        }
      }

      const { data: registration, error: regError } = await supabase
        .from("crew_registrations")
        .insert({
          ...(soloRegistrationId ? { id: soloRegistrationId } : {}),
          crew_name: format === "solo" ? members[0].name : crewName,
          institution: category === "college" ? institution : null,
          city,
          state: stateName,
          category,
          format,
          member_count: members.length,
          performance_duration: performanceDuration,
          props_used: propsUsed,
          props_details: propsUsed ? propsDetails : null,
          amount_paid: price,
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
          .from("crew_registrations")
          .update({ payment_screenshot_url: paymentPath })
          .eq("id", registration.id);
      }

      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.idProof) continue;

        const idPath = `${registration.id}/member-${i}-id-${m.idProof.name}`;
        await uploadFile(m.idProof, idPath);

        const { error: memberError } = await supabase
          .from("crew_members")
          .insert({
            registration_id: registration.id,
            name: m.name,
            phone: m.phone,
            email: m.email,
            age: m.age ? parseInt(m.age) : null,
            institution: m.institution,
            id_proof_url: idPath,
            is_leader: i === 0,
          });

        if (memberError) throw memberError;
      }

      const newCouponCode = generateCouponCode();
      // Crew registrations issue a reusable coupon (one use per member); solo
      // entries don't.
      if (format === "crew") {
        await supabase.from("coupons").insert({
          code: newCouponCode,
          source_table: "crew_registrations",
          source_registration_id: registration.id,
          max_uses: members.length,
          discount_percent: 40,
        });
      }
      await supabase
        .from("crew_registrations")
        .update({ coupon_code: newCouponCode })
        .eq("id", registration.id);
      setCouponCode(newCouponCode);

      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: TEAM_NOTIFICATION_EMAIL,
            registrantName: members[0].name,
            registrantEmail: members[0].email,
            registrantPhone: members[0].phone,
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

  if (step === "done") {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-text-primary mb-2">
            You&apos;re registered!
          </h1>
          <p className="text-text-muted">
            {event.name} —{" "}
            {format === "solo" ? "Solo" : `${members.length} members`}
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

  // Crew registration has a hard deadline (REGISTRATION_CLOSES_AT); Solo does
  // not. Only gate the crew flow - keep the Solo option and its full flow
  // reachable via the escape hatch below.
  if (!registrationOpen && format === "crew") {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-text-primary mb-4">
            Registration Closed
          </h1>
          <p className="text-text-muted">
            Crew registration for {event.name} closed on September 9, 2026.
            The deadline has passed and crew entries are no longer being
            accepted.
          </p>
          {soloVisible && !soloFull && (
            <button
              onClick={() => selectFormat("solo")}
              className="cursor-target block mx-auto mt-6 text-thermal-accent hover:underline"
            >
              Register as a solo entry instead →
            </button>
          )}
          <TransitionLink
            href={`/events/${event.slug}`}
            className="cursor-target inline-block mt-4 text-thermal-accent hover:underline"
          >
            ← Back to {event.title}
          </TransitionLink>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
    <Waves
      lineColor="rgba(77,61,255,0.3)"
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
          {step === "groupInfo" && "Crew details"}
          {step === "members" &&
            (format === "solo"
              ? "Your details"
              : `Add crew members (${MIN_MEMBERS}–${MAX_MEMBERS})`)}
          {step === "payment" && "Payment"}
        </p>

        {step === "groupInfo" && (
          <>
            {flashSale.isActive && format === "crew" && (
              <div className="rounded-xl border border-thermal-accent bg-thermal-accent/10 p-4 mb-8">
                <p className="text-thermal-accent font-medium text-sm">
                  ✨ Flash Sale: 10% off, ends in{" "}
                  <CountdownTimer timeRemainingMs={flashSale.timeRemainingMs} />
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {soloVisible && (
                <fieldset>
                  <legend className="block text-text-muted text-sm mb-2">
                    Registration Type
                  </legend>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-text-muted text-sm">
                      <input
                        type="radio"
                        checked={format === "crew"}
                        onChange={() => selectFormat("crew")}
                        className="cursor-target w-5 h-5"
                      />
                      Crew
                    </label>
                    {soloFull ? (
                      <span className="text-text-muted text-sm">
                        Solo registration is full
                      </span>
                    ) : (
                      <label className="flex items-center gap-2 text-text-muted text-sm">
                        <input
                          type="radio"
                          checked={format === "solo"}
                          onChange={() => selectFormat("solo")}
                          disabled={soloSlotsTaken === null}
                          className="cursor-target w-5 h-5"
                        />
                        Solo
                      </label>
                    )}
                  </div>
                  {soloSlotsTaken !== null && (
                    <p className="text-text-muted text-xs mt-1">
                      {soloSlotsTaken} / {SOLO_MAX_SLOTS} solo spots taken
                    </p>
                  )}
                </fieldset>
              )}

              {format === "crew" && (
                <Input label="Crew Name" value={crewName} onChange={setCrewName} />
              )}

              <div>
                <label htmlFor={categoryId} className="block text-text-muted text-sm mb-1">
                  Category
                </label>
                <select
                  id={categoryId}
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "open" | "college")
                  }
                  className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none"
                >
                  <option value="college">
                    {format === "solo" ? "College" : "College Crew"}
                  </option>
                  <option value="open">
                    {format === "solo" ? "Open" : "Open Crew"}
                  </option>
                </select>
              </div>

              {category === "college" && (
                <Input
                  label="College / University Name"
                  value={institution}
                  onChange={setInstitution}
                />
              )}

              <Input label="City" value={city} onChange={setCity} />
              <Input label="State" value={stateName} onChange={setStateName} />
            </div>

            <button
              onClick={() => setStep("members")}
              disabled={!canProceedToMembers}
              className="w-full px-8 py-3 rounded-full bg-thermal-accent text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:bg-thermal-accent/60 disabled:text-bg-base/70 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        )}

        {step === "members" && (
          <>
            <div className="space-y-4">
              {members.map((m, i) => (
                <MemberCard
                  key={i}
                  index={i}
                  member={m}
                  isOpen={openIndex === i}
                  isLeader={i === 0}
                  showLeaderBadge={format === "crew" && i === 0}
                  onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                  onChange={(field, value) => updateMember(i, field, value)}
                  onRemove={() => removeMember(i)}
                  canRemove={format === "crew" && members.length > 1}
                />
              ))}
            </div>

            {format === "crew" && members.length < MAX_MEMBERS && (
              <button
                onClick={addMember}
                className="mt-4 w-full rounded-xl border border-dashed border-white/20 py-3 text-text-muted hover:border-thermal-accent hover:text-thermal-accent transition-colors"
              >
                + Add Member
              </button>
            )}

            {format === "crew" && (
              <p className="text-text-muted text-sm mt-4">
                {members.length} / {MAX_MEMBERS} members
                {members.length < MIN_MEMBERS &&
                  ` — minimum ${MIN_MEMBERS} required`}
              </p>
            )}

            <div className="mt-8 space-y-4">
              <Input
                label="Performance Duration"
                value={performanceDuration}
                onChange={setPerformanceDuration}
              />

              <fieldset>
                <legend className="block text-text-muted text-sm mb-2">
                  Props used in performance?
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={propsUsed}
                      onChange={() => setPropsUsed(true)}
                      className="cursor-target w-5 h-5"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-text-muted text-sm">
                    <input
                      type="radio"
                      checked={!propsUsed}
                      onChange={() => setPropsUsed(false)}
                      className="cursor-target w-5 h-5"
                    />
                    No
                  </label>
                </div>
              </fieldset>

              {propsUsed && (
                <Input
                  label="Specify Props"
                  value={propsDetails}
                  onChange={setPropsDetails}
                />
              )}
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-start gap-2 text-text-muted text-sm">
                <input
                  type="checkbox"
                  checked={declaration1}
                  onChange={(e) => setDeclaration1(e.target.checked)}
                  className="mt-1 cursor-target w-5 h-5"
                />
                We agree to abide by the rules and regulations of the
                competition.
              </label>
              <label className="flex items-start gap-2 text-text-muted text-sm">
                <input
                  type="checkbox"
                  checked={declaration2}
                  onChange={(e) => setDeclaration2(e.target.checked)}
                  className="mt-1 cursor-target w-5 h-5"
                />
                All information provided is accurate.
              </label>
            </div>

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
            {flashSale.isActive && format === "crew" && (
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
                    ₹{price}
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    {format === "solo" ? "Flat fee (solo)" : "Flat fee per crew"}
                    {flashSale.isActive && format === "crew" && (
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
                onClick={() => setStep("members")}
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

function MemberCard({
  index,
  member,
  isOpen,
  isLeader,
  showLeaderBadge,
  onToggle,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  member: Member;
  isOpen: boolean;
  isLeader: boolean;
  showLeaderBadge: boolean;
  onToggle: () => void;
  onChange: (
    field: keyof Member,
    value: string | File | null | boolean
  ) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isFilled =
    member.name &&
    member.phone &&
    member.email &&
    member.age &&
    member.institution &&
    member.idProof;

  const institutionId = useId();
  const idProofId = useId();

  return (
    <div className="rounded-xl border border-white/10 bg-bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-text-primary font-medium">
          {member.name || `Member ${index + 1}`}
          {showLeaderBadge && (
            <span className="text-thermal-accent text-xs ml-2 uppercase">
              Crew Leader
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
            value={member.name}
            onChange={(v) => onChange("name", v)}
          />
          <Input
            label="Phone"
            type="tel"
            value={member.phone}
            onChange={(v) => onChange("phone", v)}
          />
          <Input
            label="Email"
            type="email"
            value={member.email}
            onChange={(v) => onChange("email", v)}
          />
          <Input
            label="Age"
            type="number"
            value={member.age}
            onChange={(v) => onChange("age", v)}
          />

<div>
  <div className="flex items-center justify-between mb-1">
    <label htmlFor={institutionId} className="block text-text-muted text-sm">Institution</label>
    {!isLeader && (
      <label className="flex items-center gap-2 text-text-muted text-xs">
        <input
          type="checkbox"
          checked={member.sameAsPoc}
          onChange={(e) => onChange("sameAsPoc", e.target.checked)}
          className="cursor-target w-5 h-5"
        />
        Same as Crew Leader
      </label>
    )}
  </div>
  <p className="text-text-muted text-xs mb-1">
    Graduated or no current institution? Enter &quot;N/A&quot;.
  </p>
  <input
    id={institutionId}
    type="text"
    value={member.institution}
    onChange={(e) => onChange("institution", e.target.value)}
    disabled={!isLeader && member.sameAsPoc}
    className="w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none disabled:bg-thermal-accent/60 disabled:text-bg-base/70 cursor-target"
  />
</div>

          <div>
            <label htmlFor={idProofId} className="block text-text-muted text-sm mb-1">
              Identity Proof (PDF or PNG)
            </label>
            <label className="flex items-center justify-between w-full rounded-lg bg-bg-base border border-dashed border-white/20 px-4 py-3 cursor-pointer hover:border-thermal-accent transition-colors">
              <span className="text-text-muted text-sm truncate">
                {member.idProof ? member.idProof.name : "Click to upload file"}
              </span>
              <span className="text-thermal-accent text-sm flex-shrink-0 ml-3">
                {member.idProof ? "Change" : "Upload"}
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

          {canRemove && (
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
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
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
        disabled={disabled}
        className="cursor-target w-full rounded-lg bg-bg-surface border border-white/10 px-4 py-2 text-text-primary focus:border-thermal-accent outline-none disabled:bg-thermal-accent/60 disabled:text-bg-base/70"
      />
    </div>
  );
}