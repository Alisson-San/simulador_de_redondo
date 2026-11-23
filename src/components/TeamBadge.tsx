import type { Team } from '../engine/types';

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Emblema gerado (hexágono com gradiente + sigla). Não reproduz logos oficiais. */
export function TeamBadge({ team, size = 32 }: { team?: Team; size?: number }) {
  if (!team) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" className="badge badge--empty" aria-hidden>
        <path d="M20 2 36 11v18L20 38 4 29V11Z" fill="none" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.5" />
        <text x="20" y="25" textAnchor="middle" fontSize="12" fill="currentColor">?</text>
      </svg>
    );
  }
  const [c1, c2] = team.colors;
  const text = luminance(c1) > 0.45 ? '#0b0b0b' : '#ffffff';
  const gid = `g-${team.id}`;
  const fs = team.tag.length >= 4 ? 9.5 : team.tag.length === 3 ? 11.5 : 13;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="badge" role="img" aria-label={team.name}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d="M20 2 36 11v18L20 38 4 29V11Z" fill={`url(#${gid})`} />
      <path d="M20 2 36 11v18L20 38 4 29V11Z" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
      <path d="M20 6 32.5 13v6.5L20 13 7.5 19.5V13Z" fill="rgba(255,255,255,.12)" />
      <text x="20" y="24.2" textAnchor="middle" fontFamily="Rajdhani, Inter, sans-serif" fontWeight="700" fontSize={fs} fill={text}>
        {team.tag}
      </text>
    </svg>
  );
}
