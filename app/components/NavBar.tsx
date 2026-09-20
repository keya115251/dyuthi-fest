"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/TransitionLink";
import { motion, AnimatePresence } from "framer-motion";
import { SPONSORS_ENABLED } from "@/app/lib/siteConfig";

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Events", href: "/events" },
  { label: "Schedule", href: "/#calendar" },
  ...(SPONSORS_ENABLED ? [{ label: "Sponsors", href: "/#sponsors" }] : []),
  { label: "Guidelines", href: "/guidelines" },
];

const visitLinks = [
  { label: "Amenities", href: "/amenities" },
  { label: "Location", href: "/location" },
  { label: "Contact", href: "/contact" },
];

export default function NavBar() {
  const [visitOpen, setVisitOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-2 bg-bg-base/70 backdrop-blur-md border-b border-white/10">
      <TransitionLink href="/">
        <img src="/dyuthi-logo.png" alt="Dyuthi" className="cursor-target h-14 w-auto invert" />
      </TransitionLink>

      <div className="font-heading hidden md:flex items-center gap-8 text-2xl tracking-wide">
        {navLinks.map((link) => (
          <TransitionLink
            key={link.label}
            href={link.href}
            className="cursor-target text-text-muted hover:text-thermal-accent hover:[text-shadow:0_0_8px_var(--color-thermal-accent)] transition-colors duration-200"
          >
            {link.label}
          </TransitionLink>
        ))}

        <div
          className="relative"
          onMouseEnter={() => setVisitOpen(true)}
          onMouseLeave={() => setVisitOpen(false)}
        >
          <button className="cursor-target text-text-muted hover:text-thermal-accent hover:[text-shadow:0_0_8px_var(--color-thermal-accent)] transition-colors duration-200">
            Visit
          </button>

          <AnimatePresence>
            {visitOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-3 w-40 rounded-xl border border-white/10 bg-bg-surface overflow-hidden"
              >
                {visitLinks.map((link) => (
                  <TransitionLink
                    key={link.label}
                    href={link.href}
                    className="cursor-target block px-4 py-3 text-lg  text-text-muted hover:text-thermal-accent hover:[text-shadow:0_0_8px_var(--color-thermal-accent)] hover:bg-white/5 transition-colors duration-200"
                  >
                    {link.label}
                  </TransitionLink>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(true)}
        className="cursor-target md:hidden flex flex-col items-center justify-center gap-1.5 w-10 h-10"
      >
        <span className="block w-6 h-0.5 bg-text-primary" />
        <span className="block w-6 h-0.5 bg-text-primary" />
        <span className="block w-6 h-0.5 bg-text-primary" />
      </button>
    </nav>

      {/*
        Rendered outside <nav> on purpose: nav has `backdrop-blur-md`, and an
        ancestor with a backdrop-filter becomes the containing block for its
        `position: fixed` descendants. Nesting the full-viewport drawer inside
        nav would resolve `bottom-0` against nav's own ~72px box instead of
        the screen, collapsing the drawer to just its header row.
      */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[80vw] bg-bg-surface border-l border-white/10 overflow-y-auto md:hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="font-heading text-xl text-text-primary">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="cursor-target text-text-muted text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <div
              className="flex flex-col px-6 py-4 font-heading text-lg tracking-wide"
              onClick={() => setMobileMenuOpen(false)}
            >
              {navLinks.map((link) => (
                <TransitionLink
                  key={link.label}
                  href={link.href}
                  className="cursor-target text-text-muted hover:text-thermal-accent py-3 border-b border-white/5"
                >
                  {link.label}
                </TransitionLink>
              ))}

              <p className="mt-5 mb-1 text-xs uppercase tracking-widest text-text-muted/70">
                Visit
              </p>
              {visitLinks.map((link) => (
                <TransitionLink
                  key={link.label}
                  href={link.href}
                  className="cursor-target text-text-muted hover:text-thermal-accent py-3 border-b border-white/5"
                >
                  {link.label}
                </TransitionLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}