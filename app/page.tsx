"use client";

import { useEffect, useState } from "react";
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
      {
        event: "Inaugural Ceremony",
        start: "9:30 AM",
        end: "11:30 AM",
        venue: "Main Stage",
      },
      {
        event: "Aangikam — Junior Category (Folk & Classical Dance Competition)",
        start: "12:00 PM",
        end: "1:30 PM",
        venue: "Assembly Hall",
      },
      {
        event: "Aangikam — Senior Category (Folk & Classical Dance Competition)",
        start: "12:00 PM",
        end: "2:30 PM",
        venue: "Main Stage",
      },
      {
        event: "Faculty Lunch",
        start: "12:30 PM",
        end: "1:30 PM",
        venue: "Car Parking Lot",
      },
      {
        event: "Music Workshop",
        start: "1:00 PM",
        end: "4:00 PM",
        venue: "SMS Block Seminar Hall",
      },
      {
        event: "3T's (Time to Tap) — Hip-Hop Dance Competition",
        start: "2:30 PM",
        end: "5:30 PM",
        venue: "Main Stage",
      },
    ],
  },
  {
    day: "Day 2 — September 19",
    slots: [
      {
        event: "Veni, Vidi, Vici. — Battle of the Bands",
        start: "8:00 AM",
        end: "2:00 PM",
        venue: "Main Stage",
      },
      {
        event: "Dance Workshop",
        start: "12:00 PM",
        end: "3:00 PM",
        venue: "Aerobics Room",
      },
      {
        event: "Musical Evening",
        start: "3:00 PM",
        end: "6:00 PM",
        venue: "Main Stage",
      },
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
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-bg-surface px-6 py-4"
                >
                  <div>
                    <p className="text-text-primary font-medium">
                      {slot.event}
                    </p>
                    <p className="text-text-muted text-sm">{slot.venue}</p>
                  </div>
                  <span className="text-text-muted text-sm uppercase tracking-wide text-right flex-shrink-0">
                    {slot.start} – {slot.end}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>

    <Reveal delay={0.3}>
  <p className="text-center text-text-muted mt-16">
    Dyuthi 2026 took place on September 18th and 19th. Thank you to
    everyone who made it a success. Hope to see y&apos;all again next
    year.
  </p>
</Reveal>
  </div>
</section>
    </main>
  );
}
