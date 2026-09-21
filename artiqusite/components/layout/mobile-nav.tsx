"use client";

import { useState } from "react";
import { NAV_LINKS } from "@/lib/nav-links";

/** Hamburger + slide-down panel for viewports below `md`, where the inline Nav links are hidden. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
      >
        <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
        <span className={`block h-[1.5px] w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-ink/10 bg-paper px-6 pb-8 pt-2 shadow-lg">
          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/8 py-4 text-[15px] font-medium text-ink/85"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#book"
            onClick={() => setOpen(false)}
            className="relative mt-6 flex h-[46px] items-center justify-center overflow-hidden rounded-[2px] bg-ink text-[13px] font-semibold tracking-[0.02em] text-paper"
          >
            Book a sample visit
            <span className="absolute right-0 top-0 h-full w-[8px] bg-brass" />
          </a>
        </div>
      )}
    </div>
  );
}
