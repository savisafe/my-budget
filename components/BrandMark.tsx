/** Логотип: монета (₸) с ростком — «сохранить и приумножить». Inline SVG. */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="bm-leaf" x1="256" y1="70" x2="256" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* Росток */}
      <path
        d="M256 208 C 250 176 250 148 256 118"
        stroke="url(#bm-leaf)"
        strokeWidth="22"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M254 176 C 196 178 160 132 172 78 C 230 82 262 124 254 176 Z" fill="url(#bm-leaf)" />
      <path d="M258 168 C 316 170 352 124 340 70 C 282 74 250 116 258 168 Z" fill="url(#bm-leaf)" />
      {/* Монета */}
      <circle cx="256" cy="336" r="150" fill="var(--color-primary)" />
      <circle cx="256" cy="336" r="126" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="8" />
      {/* Стрелка роста (валюто-нейтрально) */}
      <g stroke="#fff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M196 382 L312 298" />
        <path d="M312 298 L272 298" />
        <path d="M312 298 L312 338" />
      </g>
    </svg>
  );
}
