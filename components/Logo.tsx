import Image from "next/image";

export default function Logo({ size = 36, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative shrink-0 rounded-full p-[2px]" style={{ width: size + 4, height: size + 4, background: "linear-gradient(135deg,#c642f3,#45bcf4)" }}>
        <Image src="/logo.webp" alt="" width={size} height={size} className="rounded-full" priority />
      </span>
      {word && <span className="font-display text-[15px] font-bold tracking-[0.08em]">YUKINE</span>}
    </span>
  );
}
