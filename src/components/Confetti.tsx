import { motion } from 'framer-motion';
import { useMemo } from 'react';

export function Confetti({ colors, burstKey }: { colors: string[]; burstKey: string }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }).map((_, i) => ({
        x: (Math.random() - 0.5) * 900,
        y: 300 + Math.random() * 500,
        r: Math.random() * 720 - 360,
        d: 1.6 + Math.random() * 1.4,
        delay: Math.random() * 0.25,
        c: colors[i % colors.length],
        w: 6 + Math.random() * 6,
        round: Math.random() > 0.6,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey],
  );
  return (
    <div className="confetti" aria-hidden key={burstKey}>
      {pieces.map((p, i) => (
        <motion.i
          key={i}
          initial={{ x: 0, y: -40, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.r }}
          transition={{ duration: p.d, delay: p.delay, ease: [0.2, 0.7, 0.4, 1] }}
          style={{ background: p.c, width: p.w, height: p.round ? p.w : p.w * 0.45, borderRadius: p.round ? '50%' : 2 }}
        />
      ))}
    </div>
  );
}
