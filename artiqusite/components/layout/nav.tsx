import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS } from "@/lib/nav-links";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <div className="relative mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6 sm:h-[92px] sm:px-10 lg:px-24">
        <Link href="/" className="flex items-center gap-3 leading-none" aria-label="Artiqu Surface — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-[46px] w-[46px] rounded-[3px] object-cover sm:h-[58px] sm:w-[58px]" />
          <span>
            <span className="font-display block font-semibold text-[20px] tracking-[0.12em] text-ink sm:text-[25px] sm:tracking-[0.14em]">
              ARTIQU
            </span>
            <span className="mt-1 block text-[8px] font-bold tracking-[0.3em] text-brass sm:text-[9px]">
              SURFACE
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-small font-medium tracking-[0.01em] text-ink/82 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#book"
          className="relative hidden h-[42px] items-center overflow-hidden rounded-[2px] bg-ink pl-[30px] pr-[38px] text-[13px] font-semibold tracking-[0.02em] text-paper md:flex"
        >
          Book a sample visit
          <span className="absolute right-0 top-0 h-full w-[8px] bg-brass" />
        </a>

        <MobileNav />
      </div>
    </header>
  );
}
