// Visuels dessinés (sans photo) : pull stylisé et portant de la bannière.

const SWEATER =
  "M80 38 Q100 50 120 38 L162 58 L188 172 L164 180 L150 104 L150 214 L50 214 L50 104 L36 180 L12 172 L38 58 Z";

const PALETTE = ["#cdbba6", "#b9a48f", "#8c7a6b", "#d8cdbd", "#9a9087"];

export function tintFor(name: string) {
  const n = name.toLowerCase();
  if (/ciel|bleu/.test(n)) return "#a9c1dc";
  if (/chocolat|marron|brun/.test(n)) return "#5e4636";
  if (/ardoise|gris/.test(n)) return "#808892";
  if (/[ée]cru|cr[èe]me|blanc/.test(n)) return "#ebe2d2";
  if (/sable|beige/.test(n)) return "#d2c1ab";
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function Sweater({ color, id }: { color: string; id: string }) {
  return (
    <g>
      <defs>
        <pattern
          id={id}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
        >
          <rect width="7" height="7" fill={color} />
          <rect width="3" height="7" fill="rgba(255,255,255,0.16)" />
          <rect x="5.5" width="1.5" height="7" fill="rgba(0,0,0,0.08)" />
        </pattern>
      </defs>
      <path d={SWEATER} fill={`url(#${id})`} />
      <path
        d="M80 38 Q100 50 120 38 L122 30 Q100 40 78 30 Z"
        fill={color}
        stroke="rgba(0,0,0,0.12)"
      />
      <rect x="50" y="202" width="100" height="12" fill="rgba(0,0,0,0.08)" />
    </g>
  );
}

/** Vignette article quand aucune photo n'a encore été ajoutée. */
export function ProductPlaceholder({ name }: { name: string }) {
  const color = tintFor(name);
  const id = `maille-${color.slice(1)}`;
  return (
    <svg
      viewBox="0 0 200 250"
      className="h-full w-full"
      role="img"
      aria-label={name}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="200" height="250" fill="#e9e1d6" />
      <rect y="205" width="200" height="45" fill="#ded3c5" />
      <g transform="translate(0 6)">
        <Sweater color={color} id={id} />
      </g>
    </svg>
  );
}

/** Illustration de la bannière : pulls suspendus à un portant. */
export function HeroRail() {
  const knits = ["#f1e9db", "#d9c8b1", "#6a5142", "#8b9098", "#cdb9a2"];
  return (
    <svg
      viewBox="0 0 520 360"
      className="h-full w-full"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
    >
      <rect x="60" y="34" width="470" height="7" rx="3.5" fill="#f3ede4" />
      <rect x="60" y="34" width="7" height="340" rx="3.5" fill="#f3ede4" />
      {knits.map((color, i) => (
        <g key={color} transform={`translate(${110 + i * 88} 22) scale(1.55)`}>
          <path
            d="M100 12 Q108 12 108 20 Q108 26 100 28 L100 36"
            fill="none"
            stroke="#f7f2ea"
            strokeWidth="2.2"
          />
          <path
            d="M60 50 L100 34 L140 50"
            fill="none"
            stroke="#f7f2ea"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Sweater color={color} id={`rail-${i}`} />
        </g>
      ))}
    </svg>
  );
}
