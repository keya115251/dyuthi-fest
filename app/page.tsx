"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/TransitionLink";
import Prism from "./components/Prism";
import Waves from "./components/Waves";
import Reveal from "./components/Reveal";
import ScrollArrow from "./components/ScrollArrow";
import SponsorMarquee from "./components/SponsorMarquee";
import PhotoFilmStrip from "./components/PhotoFilmStrip";
import SideRays from "./components/SideRays";
import ColorBends from './components/ColorBends';
import { SPONSORS_ENABLED } from "./lib/siteConfig";


const calendar = [
  {
    day: "Day 1 — September 18",
    slots: [
      { time: "Morning", event: "Aangikam", host: "Chaitanya Laasya" },
      { time: "Evening", event: "3T's (Time to Tap)", host: "United Dance Crew" },
      { time: "Parallel", event: "Workshop / Celebrity Session", host: "Chaitanya Geethi x Vaadya", tba: true },
    ],
  },
  {
    day: "Day 2 — September 19",
    slots: [
      { time: "All Day", event: "Veni, Vidi, Vici.", host: "Chaitanya Geethi x Vaadya" },
      {
        time: "Parallel",
        event: "Hip-Hop Dance Workshop with Rajaram",
        host: "BFAB Dance Crew",
        detail: "September 19 · 3 hours",
        href: "/register/workshop/hip-hop-rajaram",
      },
      { time: "Parallel", event: "Workshop / Celebrity Session 2", host: "Chaitanya Laasya", tba: true },
    ],
  },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const afterAboutId = SPONSORS_ENABLED ? "sponsors" : "calendar";

  return (
    <main className="bg-bg-base">
      {/* HERO */}
      <section
  id="hero"
  onClick={() => goTo("about")}
  className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 text-center cursor-pointer bg-black"
>
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      maskImage: 'radial-gradient(circle at center, transparent 0%, transparent 35%, black 55%, black 100%)',
      WebkitMaskImage: 'radial-gradient(circle at center, transparent 0%, transparent 35%, black 55%, black 100%)'
    }}
  >
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

  <div className="absolute inset-0">
    <Prism
      animationType="rotate"
      height={isMobile ? 2 : 3.5}
      baseWidth={isMobile ? 3.2 : 5.5}
      scale={isMobile ? 2.4 : 3.6}
      hueShift={160}
      colorFrequency={0.4}
      colorSaturation={0.35}
      noise={0.05}
      glow={1.1}
      bloom={0.6}
      timeScale={0.15}
    />
  </div>

  <div className="cursor-target relative z-10 flex flex-col items-center">
    <img
      src="/dyuthi-logo.png"
      alt="Dyuthi"
      className="w-[300px] md:w-[450px] dyuthi-glow"
    />
    <p className="mt-4 text-text-primary text-lg">national performing arts festival</p>
    <p className="mt-4 text-text-primary text-lg">CBIT, Hyderabad</p>
  </div>

  <ScrollArrow targetId="about" direction="down" />
</section>

<section
  id="about"
  onClick={() => goTo(afterAboutId)}
  className="relative min-h-screen overflow-hidden cursor-pointer"
>
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
  <div className="absolute inset-0 hidden md:block">
    <SideRays
      speed={1.5}
      rayColor1="#B497CF"
      rayColor2="#B497CF"
      intensity={2}
      spread={2}
      origin="top-left"
      tilt={0}
      saturation={1.2}
      blend={0.6}
      falloff={1}
      opacity={0.9}
    />
  </div>
  {/* photo strip — pinned to right side only */}
  <div className="hidden lg:block absolute -top-20 -bottom-20 right-0 w-[700px] flex justify-end">
    <PhotoFilmStrip />
  </div>

  {/* text content */}
  <div className="relative z-10 min-h-screen flex items-center px-6 md:px-20 pt-32 pb-24 md:pb-0">
    <div className="max-w-2xl lg:pr-8">
      <Reveal>
        <h2 className="font-heading text-4xl md:text-5xl text-text-primary mb-8">
          About Dyuthi
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          Dyuthi is a national-level cultural fest bringing together three disciplines: voice, instrument, and dance, all under one stage. It's a collaboration between four clubs at Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad: Chaitanya Geethi and Vaadya (the vocal and instrumental music clubs), United Dance Crew (hip hop dance), and Laasya (classical dance). Dyuthi is built on a simple idea: every performance is its own kind of light, and this stage is where they all converge.
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          CBIT has long been home to a vibrant performing arts culture, with each of these clubs building their own community around music and dance. Dyuthi brings all four together for the first time, turning individual club events into one shared national-level fest.
        </p>
      </Reveal>

      <Reveal delay={0.3}>
        <p className="text-text-muted text-lg leading-relaxed">
          The name itself means light, radiance, brilliance, the glow that every note, every beat, every movement gives off. That&apos;s the energy we&apos;re bringing to life
          across four flagship competitions.
        </p>
      </Reveal>
    </div>
  </div>

  <ScrollArrow targetId={afterAboutId} direction="down" />
</section>


      {/* SPONSORS */}
      {SPONSORS_ENABLED && (
      <section
        id="sponsors"
        onClick={() => goTo("calendar")}
        className="relative min-h-screen flex flex-col items-center justify-center cursor-pointer overflow-hidden pb-24 md:pb-0"
      >
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
        <div className="absolute z-0 inset-0 hidden md:block">
    <ColorBends
  colors={["#B497CF", "#8FE3D9", "#F5C6E0"]}
  rotation={90}
  speed={0.2}
  scale={1}
  frequency={1}
  warpStrength={1}
  mouseInfluence={0.5}
  noise={0.15}
  parallax={0.5}
  iterations={1}
  intensity={1.5}
  bandWidth={6}
  transparent
  autoRotate={0}
/>
  </div>

        <Reveal className="relative z-10">
          <p className="text-center text-text-muted text-sm uppercase tracking-widest mb-2">
            Partners
          </p>
          <h2 className="font-heading text-5xl md:text-7xl text-text-primary text-center mb-16">
            & Sponsors
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 w-full">
          <SponsorMarquee />
        </Reveal>

        <ScrollArrow targetId="calendar" direction="down" />
      </section>
      )}

      {/* EVENT CALENDAR */}
<section id="calendar" className="relative px-6 py-32 overflow-visible">
  <div className="absolute inset-0 pointer-events-none">
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

  <div className="max-w-4xl mx-auto relative z-10">
    <Reveal>
      <h2 className="font-heading text-4xl md:text-5xl text-text-primary text-center mb-16">
        Event Calendar
      </h2>
    </Reveal>

    <div className="space-y-16">
      {calendar.map((day, dayIndex) => (
        <Reveal key={day.day} delay={dayIndex * 0.15}>
          <div>
            <h3 className="text-2xl font-semibold text-thermal-accent mb-6">
              {day.day}
            </h3>
            <div className="space-y-4">
              {day.slots.map((slot) => (
                <div
                  key={slot.event}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-bg-surface px-6 py-4"
                >
                  <div>
                    <p className="text-text-primary font-medium">
                      {slot.event}
                      {"tba" in slot && slot.tba && (
                        <span className="ml-2 text-text-muted text-xs italic">
                          To be announced
                        </span>
                      )}
                    </p>
                    {"detail" in slot && slot.detail && (
                      <p className="text-thermal-accent text-sm">{slot.detail}</p>
                    )}
                    <p className="text-text-muted text-sm">{slot.host}</p>
                    {"href" in slot && slot.href && (
                      <TransitionLink
                        href={slot.href}
                        className="cursor-target inline-block mt-2 text-sm text-thermal-accent hover:underline"
                      >
                        Register →
                      </TransitionLink>
                    )}
                  </div>
                  <span className="text-text-muted text-sm uppercase tracking-wide">
                    {slot.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>

    <Reveal delay={0.3}>
  <div className="text-center mt-16 flex flex-col sm:flex-row gap-4 justify-center">
    <TransitionLink
      href="/events"
      className="cursor-target inline-block px-12 py-5 rounded-full border border-thermal-accent text-thermal-accent font-heading text-3xl hover:bg-thermal-accent hover:text-bg-base transition-colors"
    >
      Register as Participant
    </TransitionLink>
    <TransitionLink
      href="/register/audience"
      className="cursor-target inline-block px-12 py-5 rounded-full border border-thermal-accent text-thermal-accent font-heading text-3xl hover:bg-thermal-accent hover:text-bg-base transition-colors"
    >
      Register as Audience
    </TransitionLink>
  </div>
</Reveal>
  </div>
</section>
    </main>
  );
}
