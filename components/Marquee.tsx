import { stack } from "@/lib/data";

export default function Marquee() {
  const row = [...stack, ...stack];
  return (
    <section dir="ltr" aria-label="Tools I use" className="relative -rotate-2 border-y border-line bg-brand py-5 text-[#0d0618]">
      <div className="overflow-hidden">
        <div className="marquee" style={{ ["--speed" as string]: "45s" }}>
          {row.map((s, i) => (
            <span key={i} className="flex items-center gap-8 pr-8 font-display text-3xl font-bold uppercase md:text-4xl">
              {s}
              <span aria-hidden className="text-xl">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
