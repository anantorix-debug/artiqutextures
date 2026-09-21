import { Reveal } from "@/components/reveal";
import { getPublicTestimonials } from "@/lib/api";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className={`h-3 w-3 ${i < rating ? "fill-brass" : "fill-ink/15"}`}
          aria-hidden
        >
          <path d="M8 0l2.163 5.279 5.837.454-4.446 3.75 1.37 5.517L8 12.02l-4.924 2.98 1.37-5.517L0 5.733l5.837-.454z" />
        </svg>
      ))}
    </div>
  );
}

// Testimonials are real customer quotes managed in the admin panel — unlike
// the other sections, there is no design-mockup fallback content here, so
// this section simply doesn't render if the backend has nothing published.
export async function Testimonials() {
  const items = await getPublicTestimonials(6);
  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="bg-chalk px-6 py-24 sm:px-10 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <Reveal>
          <p className="text-eyebrow text-ink/55">WHAT CLIENTS SAY</p>
          <span className="mt-4 block h-[2px] w-[34px] bg-brass" />
          <h2 className="text-head-2 mt-6 max-w-[16ch] text-ink">Ask the people who live with it.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delayMs={i * 80}>
              <figure className="flex h-full flex-col rounded-[3px] bg-paper p-8 shadow-[0px_10px_24px_0px_rgba(27,36,54,0.08)]">
                {item.rating ? <Stars rating={item.rating} /> : null}
                <blockquote className="text-lead mt-5 flex-1 text-ink-soft">“{item.quote}”</blockquote>
                <figcaption className="mt-6 border-t border-ink/10 pt-4">
                  <p className="text-head-5 text-ink">{item.customerName}</p>
                  {item.role && <p className="text-small mt-1 text-ink-soft/70">{item.role}</p>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
