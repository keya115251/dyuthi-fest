"use client";

import type { FestEvent } from "@/app/data/events";
import PrismaticBurst from "@/app/components/PrismaticBurst";
import { useFlashSale } from "@/app/lib/useFlashSale";
import CountdownTimer from "@/app/components/CountdownTimer";
import { SOLO_3TS_ENABLED } from "@/app/lib/config";

const DEFAULT_THEME_COLORS = ['#B497CF', '#4d3dff', '#C9A0F5'];

export default function EventDetails({ event }: { event: FestEvent }) {
  const flashSale = useFlashSale(event.slug);
  const soloVisible =
    SOLO_3TS_ENABLED || process.env.NODE_ENV !== "production";

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      <div
    className="absolute inset-0"
    style={{
      maskImage: 'radial-gradient(circle at center, transparent 0%, transparent 35%, black 55%, black 100%)',
      WebkitMaskImage: 'radial-gradient(circle at center, transparent 0%, transparent 35%, black 55%, black 100%)'
    }}
  >
    <PrismaticBurst
      animationType="3drotate"
      intensity={2.5}
      speed={0.4}
      distort={0}
      rayCount={0}
      mixBlendMode="none"
      colors={event.themeColors ?? DEFAULT_THEME_COLORS}
    />
  </div>      

      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl text-text-primary mb-2">
          {event.title}
        </h1>
        <p className="text-text-muted mb-1">{event.name}</p>
        <p className="text-text-muted mb-10">{event.hosts}</p>

        {flashSale.isActive && (
          <div className="rounded-xl border border-thermal-accent bg-thermal-accent/10 p-4 mb-6">
            <p className="text-thermal-accent font-medium text-sm">
              ✨ Flash Sale: 10% off, ends in{" "}
              <CountdownTimer timeRemainingMs={flashSale.timeRemainingMs} />
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 space-y-4">
          <Detail label="Eligibility" value={event.eligibility} />
          <Detail label="Prize Pool" value={event.prize} />
          {event.registrationFee && (
            <Detail label="Registration Fee" value={event.registrationFee} />
          )}
          {event.slug === "hip-hop-dance" && soloVisible && (
            <Detail
              label="Solo"
              value="₹899 · limited to 10 registrations"
            />
          )}

          {event.bandSize && (
            <Detail
              label="Band Size"
              value={`${event.bandSize.min}–${event.bandSize.max} members`}
            />
          )}
          {event.submissionFormat && (
            <Detail label="Initial Round" value={event.submissionFormat} />
          )}
          {event.selectionCount && (
            <Detail
              label="Bands Selected"
              value={`${event.selectionCount} bands for the live final`}
            />
          )}
          {event.performanceTime && (
            <Detail label="Performance Time" value={event.performanceTime} />
          )}
          {event.setupTime && (
            <Detail label="Setup Time" value={event.setupTime} />
          )}
          {event.rules && <Detail label="Genres" value={event.rules} />}

          {event.crewSize && (
            <Detail
              label="Crew Size"
              value={`${event.crewSize.min}–${event.crewSize.max} members`}
            />
          )}
          {event.competitionCategories && (
            <Detail
              label="Categories"
              value={event.competitionCategories.join(" / ")}
            />
          )}

          {event.ageGroups && (
            <Detail label="Age Groups" value={event.ageGroups.join(" · ")} />
          )}
          {event.danceForms && (
            <Detail
              label="Dance Forms"
              value={event.danceForms.join(", ")}
            />
          )}
          {event.maxGroupSize && (
            <Detail
              label="Performance"
              value={`Solo, or Group (max ${event.maxGroupSize} members)`}
            />
          )}
        </div>

        {event.rulesPdf && (
          <a
            href={event.rulesPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-6 text-thermal-accent hover:underline"
          >
            Full rulebook (PDF) →
          </a>
        )}

        <p className="text-center text-text-muted mt-16">
          Dyuthi 2026 took place on September 18th and 19th. Thank you to
          everyone who made it a success. Hope to see y&apos;all again next
          year.
        </p>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-sm uppercase tracking-wide">
        {label}
      </p>
      <p className="text-text-primary">{value}</p>
    </div>
  );
}