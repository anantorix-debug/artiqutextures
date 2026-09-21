const NAV_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Designs", href: "/designs" },
      { label: "Wood slats", href: "/#wood-slats" },
    ],
  },
  {
    heading: "Studio",
    links: [
      { label: "Projects", href: "/#projects" },
      { label: "Testimonials", href: "/#testimonials" },
      { label: "Process", href: "/#process" },
      { label: "Book a sample visit", href: "/#book" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink px-6 py-16 sm:px-10 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(2,auto)]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Artiqu Surface — where surfaces become art" className="h-[150px] w-auto rounded-[4px]" />
            <address className="text-small mt-6 not-italic text-paper/60">
              No 15, 3rd Cross Street
              <br />
              Salem 636001
            </address>
          </div>

          {NAV_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-caption font-semibold tracking-[0.05em] text-paper/45">{col.heading}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-small text-paper/75 transition-colors hover:text-paper">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-paper/12 pt-6">
          <p className="text-caption text-paper/45">© 2026 Artiqu Surface</p>
        </div>
      </div>
    </footer>
  );
}
