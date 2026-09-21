import { Reveal } from "@/components/reveal";
import { PlasterSwatch } from "@/components/texture/plaster-swatch";
import { ContactForm } from "@/components/forms/contact-form";

export function Book() {
  return (
    <section id="book" className="relative overflow-hidden bg-plaster">
      <div className="absolute inset-0">
        <PlasterSwatch baseColor="#cbc1b0" seed="book-wall" lightAngle={210} className="h-full w-full" />
      </div>
      <div className="relative mx-auto max-w-[1248px] px-6 py-24 sm:px-10 lg:px-24">
        <Reveal className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-head-1 max-w-[12ch] text-ink">
              Bring us the wall.
              <br />
              We will bring the samples.
            </h2>
            <p className="text-small mt-5 max-w-[440px] text-ink-soft/85">
              Sample visits are free within Salem and take about forty minutes.
            </p>
          </div>

          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
