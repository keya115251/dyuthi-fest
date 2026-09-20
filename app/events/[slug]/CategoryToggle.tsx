"use client";

import { useState } from "react";
import type { FestEvent } from "@/app/data/events";

export default function CategoryToggle({ event }: { event: FestEvent }) {
  const categories = event.categories ?? [];
  const [active, setActive] = useState(0);

  return (
    <main className="relative min-h-screen bg-bg-base px-6 pt-32 pb-20 overflow-hidden">
      {event.decorImages?.topLeft && (
        <img
          src={event.decorImages.topLeft}
          alt=""
          className="hidden lg:block absolute top-24 left-0 w-[550px] opacity-70 pointer-events-none select-none"
        />
      )}
      {event.decorImages?.topRight && (
        <img
          src={event.decorImages.topRight}
          alt=""
          className="hidden lg:block absolute top-24 right-0 w-100 opacity-70 pointer-events-none select-none"
        />
      )}
      {event.decorImages?.bottomLeft && (
        <img
          src={event.decorImages.bottomLeft}
          alt=""
          className="hidden lg:block absolute bottom-0 left-0 w-100 opacity-70 pointer-events-none select-none"
        />
      )}
      {event.decorImages?.bottomRight && (
        <img
          src={event.decorImages.bottomRight}
          alt=""
          className="hidden lg:block absolute bottom-0 right-0 w-[550px] opacity-70 pointer-events-none select-none"
        />
      )}

      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl text-text-primary mb-2 text-center">
          {event.title}
        </h1>
        <p className="text-text-muted mb-12 text-center">{event.hosts}</p>

        <div className="relative flex mx-auto mb-10 w-fit rounded-full border border-white/10 bg-bg-surface p-1">
          <div
            className="absolute top-1 bottom-1 rounded-full bg-thermal-accent transition-transform duration-300 ease-out"
            style={{
              width: `${100 / categories.length}%`,
              transform: `translateX(${active * 100}%)`,
            }}
          />
          {categories.map((cat, i) => (
            <button
              key={cat.type}
              onClick={() => setActive(i)}
              className={`relative z-10 px-8 py-2 rounded-full text-sm font-semibold capitalize transition-colors duration-300 ${
                active === i ? "text-bg-base" : "text-text-muted"
              }`}
              style={{ width: `${100 / categories.length}%` }}
            >
              {cat.type}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 space-y-4">
          <Detail label="Eligibility" value={event.eligibility} />
          <Detail label="Prize" value={event.prize} />
          <Detail
            label="Team Size"
            value={
              categories[active].teamSize
                ? `${categories[active].teamSize?.min ?? "TBD"} - ${
                    categories[active].teamSize?.max ?? "TBD"
                  }`
                : "Individual"
            }
          />
          <Detail label="Rules" value={event.rules || "Coming soon"} />
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