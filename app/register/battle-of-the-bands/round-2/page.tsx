import { events } from "@/app/data/events";
import { notFound } from "next/navigation";
import TransitionLink from "@/app/components/TransitionLink";
import Round2Form from "./Round2Form";

// Visible in development regardless of round2Open so it can be tested
// locally before Round 1 selections are announced - same dev-preview
// pattern as FLASH_SALE_DEV_PREVIEW in app/lib/useFlashSale.ts.
const ROUND2_DEV_PREVIEW = process.env.NODE_ENV !== "production";

export default function Round2Page() {
  const event = events.find((e) => e.slug === "battle-of-the-bands");
  if (!event) notFound();

  if (!event.round2Open && !ROUND2_DEV_PREVIEW) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-text-primary mb-4">
            Round 2 Not Open Yet
          </h1>
          <p className="text-text-muted">
            Round 2 registration opens once Round 1 selections are
            announced on our Instagram page.
          </p>
          <TransitionLink
            href="/events/battle-of-the-bands"
            className="cursor-target inline-block mt-6 text-thermal-accent hover:underline"
          >
            ← Back to Veni, Vidi, Vici.
          </TransitionLink>
        </div>
      </main>
    );
  }

  return <Round2Form />;
}