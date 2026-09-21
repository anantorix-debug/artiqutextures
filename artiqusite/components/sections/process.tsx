import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    number: "01",
    title: "Measure & mix",
    body: "We read the room — light, height, humidity — and mix three candidate finishes to your brief.",
  },
  {
    number: "02",
    title: "Sample on the wall",
    body: "A 300 mm patch of each goes up on the actual wall. Live with them for a week before choosing.",
  },
  {
    number: "03",
    title: "Prep the surface",
    body: "Levelling, priming, and for slats the batten frame and acoustic felt go up. Dust-sheeted throughout.",
  },
  {
    number: "04",
    title: "Apply & cure",
    body: "Two or three coats worked by hand, or panels fixed and oiled. We come back at day 30 to check the cure.",
  },
];

export function Process() {
  return (
    <section id="process" className="bg-paper px-6 py-24 sm:px-10 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-eyebrow text-ink/55">HOW IT GOES</p>
            <span className="mt-4 block h-[2px] w-[34px] bg-brass" />
            <h2 className="text-head-2 mt-6 text-ink">Four steps, about a week.</h2>
          </div>
          <p className="text-body max-w-[424px] text-ink-soft/82">
            Nothing gets applied until you have seen it dry on your own wall, in your own light.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delayMs={i * 90}>
              <span className="block h-[2px] w-full bg-ink/90" />
              <p className="mt-6 font-display text-[15px] font-semibold tracking-[0.06em] text-brass">
                {step.number}
              </p>
              <h3 className="text-head-4 mt-3 text-ink">{step.title}</h3>
              <p className="text-small mt-3 max-w-[262px] text-ink-soft/82">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
