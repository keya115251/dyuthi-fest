import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { clubs, ClubId } from "@/app/lib/clubAuth";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { SHOW_OCR_VERIFICATION } from "@/app/lib/config";
import MarkSelectedButton from "./MarkSelectedButton";
import LogoutButton from "./LogoutButton";

const STORAGE_BUCKET = "registration-uploads";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

// ---------- shared types ----------

type DanceParticipant = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  age: number | null;
  institution: string;
  id_proof_url: string | null;
  is_head: boolean;
  id_name_match_score: number | null;
  needs_review: boolean | null;
};

type DanceRegistration = {
  id: string;
  created_at: string;
  performance_type: string;
  dance_form: string;
  age_group: string;
  city: string;
  state: string;
  email: string;
  participant_count: number;
  amount_paid: number;
  payment_pending: boolean;
  payee_name: string | null;
  payee_phone: string | null;
  utr_reference: string | null;
  payment_screenshot_url: string | null;
  coupon_code: string | null;
  payment_amount_matches: boolean | null;
  needs_review: boolean | null;
  dance_participants: DanceParticipant[];
};

type CrewMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number | null;
  institution: string;
  id_proof_url: string | null;
  is_leader: boolean;
  id_name_match_score: number | null;
  needs_review: boolean | null;
};

type CrewRegistration = {
  id: string;
  created_at: string;
  crew_name: string;
  category: string;
  format: string | null;
  institution: string | null;
  city: string;
  state: string;
  member_count: number;
  performance_duration: string | null;
  amount_paid: number;
  payment_pending: boolean;
  payee_name: string | null;
  payee_phone: string | null;
  utr_reference: string | null;
  payment_screenshot_url: string | null;
  coupon_code: string | null;
  payment_amount_matches: boolean | null;
  needs_review: boolean | null;
  crew_members: CrewMember[];
};

type BandParticipant = {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number | null;
  institution: string;
  id_proof_url: string | null;
  is_primary_contact: boolean;
  is_roadie: boolean | null;
  id_name_match_score: number | null;
  needs_review: boolean | null;
};

type BandRegistration = {
  id: string;
  created_at: string;
  band_name: string;
  participant_count: number;
  city: string;
  state: string;
  video_link: string | null;
  poc_name: string;
  poc_phone: string;
  poc_email: string;
  poc_institution: string | null;
  status: string;
  amount_paid: number;
  payment_pending: boolean;
  payee_name: string | null;
  payee_phone: string | null;
  utr_reference: string | null;
  payment_screenshot_url: string | null;
  payment_amount_matches: boolean | null;
  needs_review: boolean | null;
  coupon_code: string | null;
  round2_amount_paid: number | null;
  round2_payment_screenshot_url: string | null;
  round2_completed_at: string | null;
  round2_payee_name: string | null;
  round2_payee_phone: string | null;
  round2_utr_reference: string | null;
  round2_payment_amount_matches: boolean | null;
  round2_needs_review: boolean | null;
  band_participants: BandParticipant[];
};

type AudienceRegistration = {
  id: string;
  created_at: string;
  name: string;
  age: number | null;
  institution: string;
  phone: string;
  email: string;
  amount_paid: number;
  payment_pending: boolean;
  payee_name: string | null;
  payee_phone: string | null;
  utr_reference: string | null;
  payment_screenshot_url: string | null;
};

// ---------- page ----------

type AdminView = "dance" | "crew" | "band" | "audience";

const VIEW_TABS: { id: AdminView; label: string }[] = [
  { id: "dance", label: "Aangikam (Dance)" },
  { id: "crew", label: "3T's (Crew)" },
  { id: "band", label: "Veni Vidi Vici (Band)" },
  { id: "audience", label: "Audience" },
];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const cookieStore = await cookies();
  const clubId = cookieStore.get("admin_club")?.value as ClubId | undefined;

  if (!clubId || !(clubId in clubs)) {
    redirect("/admin/login");
  }

  if (clubId === "laasya") return renderLaasyaDashboard(clubs.laasya.eventName);
  if (clubId === "udc") return renderUdcDashboard(clubs.udc.eventName);
  if (clubId === "geethi-vaadya")
    return renderBandDashboard(clubs["geethi-vaadya"].eventName);

  // main admin — pick which club's data to view via ?view=, one table at a time
  const { view } = await searchParams;
  const selected: AdminView =
    view === "crew" || view === "band" || view === "audience" ? view : "dance";

  const tabs = <AdminViewTabs current={selected} />;

  if (selected === "crew") return renderUdcDashboard(clubs.udc.eventName, tabs);
  if (selected === "band")
    return renderBandDashboard(clubs["geethi-vaadya"].eventName, tabs);
  if (selected === "audience") return renderAudienceDashboard(tabs);
  return renderLaasyaDashboard(clubs.laasya.eventName, tabs);
}

function AdminViewTabs({ current }: { current: AdminView }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {VIEW_TABS.map((t) => (
        <Link
          key={t.id}
          href={`/admin?view=${t.id}`}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            current === t.id
              ? "bg-thermal-mid-hot text-bg-base"
              : "bg-bg-surface text-text-muted border border-white/10 hover:text-text-primary"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ---------- club dashboards ----------

async function renderLaasyaDashboard(heading: string, tabs?: ReactNode) {
  const { data, error } = await supabaseAdmin
    .from("dance_registrations")
    .select("*, dance_participants(*)")
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as DanceRegistration[];

  const paths: (string | null)[] = [];
  for (const r of registrations) {
    paths.push(r.payment_screenshot_url);
    for (const p of r.dance_participants ?? []) paths.push(p.id_proof_url);
  }
  const urls = await buildSignedUrlMap(paths);

  return (
    <DashboardShell
      heading={heading}
      count={registrations.length}
      error={!!error}
      tabs={tabs}
    >
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <div className="min-w-[1600px] divide-y divide-white/10">
          <div
            className="grid gap-2 bg-bg-surface text-text-muted text-xs uppercase tracking-wide px-4 py-3"
            style={{ gridTemplateColumns: GRID_16 }}
          >
            {LAASYA_COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          {registrations.map((r) => (
            <details key={r.id} className="group">
              <summary
                className={`grid gap-2 items-center px-4 py-3 cursor-pointer text-text-primary text-sm hover:bg-white/5 ${
                  SHOW_OCR_VERIFICATION && r.needs_review
                    ? "border-l-4 border-thermal-accent bg-thermal-accent/5"
                    : ""
                }`}
                style={{ gridTemplateColumns: GRID_16 }}
              >
                <span className="capitalize">{r.performance_type}</span>
                <span>{r.dance_form}</span>
                <span className="capitalize">{r.age_group}</span>
                <span>{r.city}</span>
                <span>{r.state}</span>
                <span className="max-w-40 wrap-break-word" title={r.email}>
                  {r.email}
                </span>
                <span>{r.participant_count}</span>
                <span>₹{r.amount_paid}</span>
                <span>{formatBool(r.payment_pending)}</span>
                {SHOW_OCR_VERIFICATION && (
                  <span>
                    <ReviewBadge flag={r.needs_review} />
                  </span>
                )}
                {SHOW_OCR_VERIFICATION && (
                  <span>
                    <MatchBadge matches={r.payment_amount_matches} />
                  </span>
                )}
                <span>
                  <FileLink url={urls.get(r.payment_screenshot_url ?? "")} />
                </span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.utr_reference ?? undefined}
                >
                  {r.utr_reference ?? "—"}
                </span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.payee_name ?? undefined}
                >
                  {r.payee_name ?? "—"}
                </span>
                <span>{r.payee_phone ?? "—"}</span>
                <span className="font-mono text-xs">
                  {r.coupon_code ?? "—"}
                </span>
                <Expander />
              </summary>

              <div className="px-4 pb-4 bg-bg-base/40">
                <ParticipantTable
                  rows={r.dance_participants ?? []}
                  urls={urls}
                  leaderKey="is_head"
                  leaderLabel="Head"
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

async function renderUdcDashboard(heading: string, tabs?: ReactNode) {
  const { data, error } = await supabaseAdmin
    .from("crew_registrations")
    .select("*, crew_members(*)")
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as CrewRegistration[];

  const paths: (string | null)[] = [];
  for (const r of registrations) {
    paths.push(r.payment_screenshot_url);
    for (const m of r.crew_members ?? []) paths.push(m.id_proof_url);
  }
  const urls = await buildSignedUrlMap(paths);

  return (
    <DashboardShell
      heading={heading}
      count={registrations.length}
      error={!!error}
      tabs={tabs}
    >
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <div className="min-w-[1600px] divide-y divide-white/10">
          <div
            className="grid gap-2 bg-bg-surface text-text-muted text-xs uppercase tracking-wide px-4 py-3"
            style={{ gridTemplateColumns: GRID_UDC }}
          >
            {UDC_COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          {registrations.map((r) => (
            <details key={r.id} className="group">
              <summary
                className={`grid gap-2 items-center px-4 py-3 cursor-pointer text-text-primary text-sm hover:bg-white/5 ${
                  SHOW_OCR_VERIFICATION && r.needs_review
                    ? "border-l-4 border-thermal-accent bg-thermal-accent/5"
                    : ""
                }`}
                style={{ gridTemplateColumns: GRID_UDC }}
              >
                <span className="max-w-40 wrap-break-word" title={r.crew_name}>
                  {r.crew_name}
                </span>
                <span className="capitalize">
                  {r.format === "solo" ? "Solo" : "Crew"}
                </span>
                <span className="capitalize">{r.category}</span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.institution ?? undefined}
                >
                  {r.institution ?? "—"}
                </span>
                <span>{r.city}</span>
                <span>{r.state}</span>
                <span>{r.member_count}</span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.performance_duration ?? undefined}
                >
                  {r.performance_duration ?? "—"}
                </span>
                <span>₹{r.amount_paid}</span>
                <span>{formatBool(r.payment_pending)}</span>
                {SHOW_OCR_VERIFICATION && (
                  <span>
                    <ReviewBadge flag={r.needs_review} />
                  </span>
                )}
                {SHOW_OCR_VERIFICATION && (
                  <span>
                    <MatchBadge matches={r.payment_amount_matches} />
                  </span>
                )}
                <span>
                  <FileLink url={urls.get(r.payment_screenshot_url ?? "")} />
                </span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.utr_reference ?? undefined}
                >
                  {r.utr_reference ?? "—"}
                </span>
                <span
                  className="max-w-40 wrap-break-word"
                  title={r.payee_name ?? undefined}
                >
                  {r.payee_name ?? "—"}
                </span>
                <span>{r.payee_phone ?? "—"}</span>
                <span className="font-mono text-xs">
                  {r.coupon_code ?? "—"}
                </span>
                <Expander />
              </summary>

              <div className="px-4 pb-4 bg-bg-base/40">
                <ParticipantTable
                  rows={r.crew_members ?? []}
                  urls={urls}
                  leaderKey="is_leader"
                  leaderLabel="Leader"
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

async function renderBandDashboard(heading: string, tabs?: ReactNode) {
  const { data, error } = await supabaseAdmin
    .from("band_registrations")
    .select("*, band_participants(*)")
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as BandRegistration[];

  const paths: (string | null)[] = [];
  for (const r of registrations) {
    paths.push(r.payment_screenshot_url, r.round2_payment_screenshot_url);
    for (const p of r.band_participants ?? []) paths.push(p.id_proof_url);
  }
  const urls = await buildSignedUrlMap(paths);

  return (
    <DashboardShell
      heading={heading}
      count={registrations.length}
      error={!!error}
      tabs={tabs}
    >
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <div className="min-w-325 divide-y divide-white/10">
          <div
            className="grid gap-2 bg-bg-surface text-text-muted text-xs uppercase tracking-wide px-4 py-3"
            style={{ gridTemplateColumns: GRID_12 }}
          >
            {BAND_COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          {registrations.map((r) => {
            const round2Started =
              !!r.round2_completed_at ||
              r.round2_amount_paid != null ||
              !!r.round2_payment_screenshot_url;
            const anyNeedsReview = r.needs_review || r.round2_needs_review;

            return (
              <details key={r.id} className="group">
                <summary
                  className={`grid gap-2 items-center px-4 py-3 cursor-pointer text-text-primary text-sm hover:bg-white/5 ${
                    SHOW_OCR_VERIFICATION && anyNeedsReview
                      ? "border-l-4 border-thermal-accent bg-thermal-accent/5"
                      : ""
                  }`}
                  style={{ gridTemplateColumns: GRID_12 }}
                >
                  <span className="max-w-40 wrap-break-word" title={r.band_name}>
                    {r.band_name}
                  </span>
                  <span>{r.participant_count}</span>
                  <span>{r.city}</span>
                  <span>{r.state}</span>
                  <span>
                    <FileLink url={r.video_link} />
                  </span>
                  <span className="max-w-40 wrap-break-word" title={r.poc_name}>
                    {r.poc_name}
                  </span>
                  <span>{r.poc_phone}</span>
                  <span className="max-w-40 wrap-break-word" title={r.poc_email}>
                    {r.poc_email}
                  </span>
                  <span
                    className="max-w-40 wrap-break-word"
                    title={r.poc_institution ?? undefined}
                  >
                    {r.poc_institution ?? "—"}
                  </span>
                  <span className="capitalize">{r.status}</span>
                  <span>
                    {formatBool(r.payment_pending) === "Yes" ? "Pending" : "Paid"} · ₹
                    {r.amount_paid}
                  </span>
                  <span>
                    {r.round2_completed_at
                      ? "Completed"
                      : round2Started
                      ? "In Progress"
                      : "Not Started"}
                  </span>
                  {SHOW_OCR_VERIFICATION && (
                    <span>
                      <ReviewBadge flag={anyNeedsReview} />
                    </span>
                  )}
                  <span className="font-mono text-xs">
                    {r.coupon_code ?? "—"}
                  </span>
                  <Expander />
                </summary>

                <div className="px-4 pb-4 bg-bg-base/40 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl border border-white/10 p-4">
                      <h3 className="text-thermal-accent text-xs uppercase tracking-wide mb-2">
                        Round 1
                      </h3>
                      <dl className="text-sm space-y-1.5">
                        <Row label="Amount Paid" value={`₹${r.amount_paid}`} />
                        <Row
                          label="Payment Pending"
                          value={formatBool(r.payment_pending)}
                        />
                        {SHOW_OCR_VERIFICATION && (
                          <Row
                            label="Payment Match"
                            value={<MatchBadge matches={r.payment_amount_matches} />}
                          />
                        )}
                        <Row
                          label="Screenshot"
                          value={
                            <FileLink url={urls.get(r.payment_screenshot_url ?? "")} />
                          }
                        />
                        <Row label="UTR Reference" value={r.utr_reference ?? "—"} />
                        <Row label="Payee Name" value={r.payee_name ?? "—"} />
                        <Row label="Payee Phone" value={r.payee_phone ?? "—"} />
                        {SHOW_OCR_VERIFICATION && (
                          <Row
                            label="Needs Review"
                            value={<ReviewBadge flag={r.needs_review} />}
                          />
                        )}
                      </dl>

                      <div className="mt-3 pt-3 border-t border-white/10">
                        {r.status === "selected" ? (
                          <span className="inline-block rounded-full bg-thermal-accent/20 text-thermal-accent text-xs font-semibold px-2 py-0.5">
                            Selected for Round 2
                          </span>
                        ) : (
                          <MarkSelectedButton id={r.id} />
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 p-4">
                      <h3 className="text-thermal-accent text-xs uppercase tracking-wide mb-2">
                        Round 2
                      </h3>
                      {round2Started ? (
                        <dl className="text-sm space-y-1.5">
                          <Row
                            label="Amount Paid"
                            value={
                              r.round2_amount_paid != null
                                ? `₹${r.round2_amount_paid}`
                                : "—"
                            }
                          />
                          <Row
                            label="Screenshot"
                            value={
                              <FileLink
                                url={urls.get(r.round2_payment_screenshot_url ?? "")}
                              />
                            }
                          />
                          <Row
                            label="Completed At"
                            value={formatDate(r.round2_completed_at)}
                          />
                          {SHOW_OCR_VERIFICATION && (
                            <Row
                              label="Payment Match"
                              value={
                                <MatchBadge matches={r.round2_payment_amount_matches} />
                              }
                            />
                          )}
                          <Row
                            label="UTR Reference"
                            value={r.round2_utr_reference ?? "—"}
                          />
                          <Row
                            label="Payee Name"
                            value={r.round2_payee_name ?? "—"}
                          />
                          <Row
                            label="Payee Phone"
                            value={r.round2_payee_phone ?? "—"}
                          />
                          {SHOW_OCR_VERIFICATION && (
                            <Row
                              label="Needs Review"
                              value={<ReviewBadge flag={r.round2_needs_review} />}
                            />
                          )}
                        </dl>
                      ) : (
                        <p className="text-text-muted text-sm">Not started.</p>
                      )}
                    </div>
                  </div>

                  <ParticipantTable
                    rows={r.band_participants ?? []}
                    urls={urls}
                    leaderKey="is_primary_contact"
                    leaderLabel="POC"
                  />
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

// ---------- audience dashboard (main admin only) ----------

async function renderAudienceDashboard(tabs?: ReactNode) {
  const { data, error } = await supabaseAdmin
    .from("audience_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as AudienceRegistration[];

  const urls = await buildSignedUrlMap(
    registrations.map((r) => r.payment_screenshot_url)
  );

  return (
    <DashboardShell
      heading="Audience"
      count={registrations.length}
      error={!!error}
      tabs={tabs}
    >
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <div className="min-w-350 divide-y divide-white/10">
          <div
            className="grid gap-2 bg-bg-surface text-text-muted text-xs uppercase tracking-wide px-4 py-3"
            style={{ gridTemplateColumns: GRID_11 }}
          >
            {AUDIENCE_COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          {registrations.map((r) => (
            <div
              key={r.id}
              className="grid gap-2 items-center px-4 py-3 text-text-primary text-sm"
              style={{ gridTemplateColumns: GRID_11 }}
            >
              <span className="max-w-40 wrap-break-word" title={r.name}>
                {r.name}
              </span>
              <span>{r.age ?? "—"}</span>
              <span className="max-w-40 wrap-break-word" title={r.institution}>
                {r.institution}
              </span>
              <span>{r.phone}</span>
              <span className="max-w-40 wrap-break-word" title={r.email}>
                {r.email}
              </span>
              <span>₹{r.amount_paid}</span>
              <span>{formatBool(r.payment_pending)}</span>
              <span className="max-w-40 wrap-break-word" title={r.payee_name ?? undefined}>
                {r.payee_name ?? "—"}
              </span>
              <span>{r.payee_phone ?? "—"}</span>
              <span className="max-w-40 wrap-break-word" title={r.utr_reference ?? undefined}>
                {r.utr_reference ?? "—"}
              </span>
              <span>
                <FileLink url={urls.get(r.payment_screenshot_url ?? "")} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

// ---------- layout helpers ----------

function DashboardShell({
  heading,
  count,
  error,
  tabs,
  children,
}: {
  heading: string;
  count: number;
  error: boolean;
  tabs?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-bg-base px-6 pt-32 pb-16">
      <div className="max-w-6xl mx-auto">
        {tabs}
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-bold text-text-primary">
            {heading} — Registrations
          </h1>
          <LogoutButton />
        </div>
        <p className="text-text-muted mb-8">{count} total</p>

        {error && (
          <p className="text-thermal-accent mb-4">Error loading registrations.</p>
        )}

        {children}
      </div>
    </main>
  );
}

function Expander() {
  return (
    <span className="text-text-muted text-right">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-text-muted shrink-0">{label}</dt>
      <dd className="text-text-primary text-right wrap-break-word">{value}</dd>
    </div>
  );
}

type GenericMember = {
  id: string;
  name: string;
  phone?: string;
  contact?: string | null;
  email: string | null;
  age: number | null;
  institution: string;
  id_proof_url: string | null;
  id_name_match_score: number | null;
  needs_review: boolean | null;
  is_head?: boolean;
  is_leader?: boolean;
  is_primary_contact?: boolean;
  is_roadie?: boolean | null;
};

function ParticipantTable({
  rows,
  urls,
  leaderKey,
  leaderLabel,
}: {
  rows: GenericMember[];
  urls: Map<string, string>;
  leaderKey: "is_head" | "is_leader" | "is_primary_contact";
  leaderLabel: string;
}) {
  return (
    <table className="w-full text-left text-sm mt-2">
      <thead className="text-text-muted text-xs uppercase">
        <tr>
          <th className="py-2 pr-4">Name</th>
          <th className="py-2 pr-4">Contact</th>
          <th className="py-2 pr-4">Email</th>
          <th className="py-2 pr-4">Age</th>
          <th className="py-2 pr-4">Institution</th>
          <th className="py-2 pr-4">ID Proof</th>
          {SHOW_OCR_VERIFICATION && (
            <>
              <th className="py-2 pr-4">ID Match Score</th>
              <th className="py-2 pr-4">Review</th>
            </>
          )}
        </tr>
      </thead>
      <tbody className="text-text-primary">
        {rows.map((m) => (
          <tr key={m.id} className="border-t border-white/10">
            <td className="py-2 pr-4 wrap-break-word">
              {m.name}
              {m[leaderKey] && (
                <span className="text-thermal-accent text-xs ml-2 uppercase">
                  {leaderLabel}
                </span>
              )}
              {m.is_roadie && (
                <span className="inline-block rounded-full bg-white/10 text-text-muted text-xs font-semibold ml-2 px-2 py-0.5 uppercase">
                  Roadie
                </span>
              )}
            </td>
            <td className="py-2 pr-4 wrap-break-word">
              {m.phone ?? m.contact ?? "—"}
            </td>
            <td className="py-2 pr-4 wrap-break-word">{m.email ?? "—"}</td>
            <td className="py-2 pr-4">{m.age ?? "—"}</td>
            <td className="py-2 pr-4 wrap-break-word">{m.institution}</td>
            <td className="py-2 pr-4">
              <FileLink url={urls.get(m.id_proof_url ?? "")} />
            </td>
            {SHOW_OCR_VERIFICATION && (
              <>
                <td className="py-2 pr-4">{m.id_name_match_score ?? "—"}</td>
                <td className="py-2 pr-4">
                  <ReviewBadge flag={m.needs_review} />
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------- formatting helpers ----------

function formatBool(v: boolean | null | undefined) {
  if (v === null || v === undefined) return "—";
  return v ? "Yes" : "No";
}

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ReviewBadge({ flag }: { flag: boolean | null | undefined }) {
  if (!flag) return <span className="text-text-muted">—</span>;
  return (
    <span className="inline-block rounded-full bg-thermal-accent/20 text-thermal-accent text-xs font-semibold px-2 py-0.5">
      Needs Review
    </span>
  );
}

function MatchBadge({ matches }: { matches: boolean | null | undefined }) {
  if (matches === null || matches === undefined) {
    return <span className="text-text-muted text-xs">Not checked</span>;
  }
  return matches ? (
    <span className="text-text-muted text-xs">Match</span>
  ) : (
    <span className="inline-block rounded-full bg-thermal-accent/20 text-thermal-accent text-xs font-semibold px-2 py-0.5">
      Mismatch
    </span>
  );
}

function FileLink({ url }: { url: string | null | undefined }) {
  if (!url) return <span className="text-text-muted">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-thermal-accent underline"
    >
      View
    </a>
  );
}

// ---------- storage ----------

async function buildSignedUrlMap(
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data) return map;

  for (const item of data) {
    if (item.signedUrl && !item.error && item.path) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}

// ---------- column definitions ----------

// Column counts below (used for the CSS grid track count) shrink when the
// Review/Match columns are hidden via SHOW_OCR_VERIFICATION - keep these in
// sync with LAASYA_COLUMNS/UDC_COLUMNS/BAND_COLUMNS below.
const GRID_16 = `repeat(${SHOW_OCR_VERIFICATION ? 16 : 14}, minmax(100px, 1fr)) 32px`;
const GRID_UDC = `repeat(${SHOW_OCR_VERIFICATION ? 17 : 15}, minmax(100px, 1fr)) 32px`;
const GRID_12 = `repeat(${SHOW_OCR_VERIFICATION ? 14 : 13}, minmax(110px, 1fr)) 32px`;
const GRID_11 = `repeat(11, minmax(100px, 1fr))`;

const OCR_SUMMARY_COLUMNS = SHOW_OCR_VERIFICATION ? ["Review", "Match"] : [];
const OCR_BAND_SUMMARY_COLUMNS = SHOW_OCR_VERIFICATION ? ["Review"] : [];

const LAASYA_COLUMNS = [
  "Type",
  "Dance Form",
  "Age Group",
  "City",
  "State",
  "Email",
  "Participants",
  "Amount",
  "Pending",
  ...OCR_SUMMARY_COLUMNS,
  "Screenshot",
  "UTR",
  "Payee",
  "Payee Phone",
  "Coupon",
  "",
];

const UDC_COLUMNS = [
  "Crew Name",
  "Format",
  "Category",
  "Institution",
  "City",
  "State",
  "Members",
  "Duration",
  "Amount",
  "Pending",
  ...OCR_SUMMARY_COLUMNS,
  "Screenshot",
  "UTR",
  "Payee",
  "Payee Phone",
  "Coupon",
  "",
];

const AUDIENCE_COLUMNS = [
  "Name",
  "Age",
  "Institution",
  "Phone",
  "Email",
  "Amount",
  "Pending",
  "Payee",
  "Payee Phone",
  "UTR",
  "Screenshot",
];

const BAND_COLUMNS = [
  "Band Name",
  "Members",
  "City",
  "State",
  "Video Link",
  "POC Name",
  "POC Phone",
  "POC Email",
  "POC Institution",
  "Status",
  "Round 1",
  "Round 2",
  ...OCR_BAND_SUMMARY_COLUMNS,
  "Coupon",
  "",
];
