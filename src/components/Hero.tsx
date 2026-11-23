import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { simulateFrom } from '../engine/simulate';
import { computeTournament } from '../engine/tournament';
import type { TournamentApi } from '../state';
import { TeamBadge } from './TeamBadge';

function useCountdown(iso: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  return { d, h, m, s };
}

export function Hero({ api }: { api: TournamentApi }) {
  const { def, state } = api;
  const cd = useCountdown(def.startDate);
  const champ = state.champion ? api.teamMap.get(state.champion) : undefined;
  // total de jogos do formato: simula uma vez (modo favorito) e conta — funciona para qualquer formato
  const totalSlots = useMemo(() => {
    const full = computeTournament(def, simulateFrom(def, api.teamMap, {}, { mode: 'favorite' }));
    return full.totalMatches;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id]);
  const globalPct = Math.min(1, state.decidedMatches / Math.max(totalSlots, 1));

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden>
        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="grid-lines" />
      </div>
      <div className="hero__content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero__kicker">
          <span className="live-dot" /> {def.game} · {def.organizer}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {def.name}
        </motion.h1>
        <motion.div className="hero__facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          <span>📍 {def.location}</span>
          <span>📅 {def.dates}</span>
          <span>💰 {def.prizePool}</span>
          <span>👥 {def.teams.length} times</span>
        </motion.div>

        <div className="hero__row">
          {cd ? (
            <div className="countdown" aria-label="Contagem regressiva">
              <span className="countdown__label">Começa em</span>
              {[
                [cd.d, 'd'],
                [cd.h, 'h'],
                [cd.m, 'min'],
                [cd.s, 's'],
              ].map(([v, l]) => (
                <span key={l as string} className="countdown__unit">
                  <b>{String(v).padStart(2, '0')}</b>
                  <small>{l}</small>
                </span>
              ))}
            </div>
          ) : (
            <div className="countdown">
              <span className="live-dot" /> Em andamento
            </div>
          )}
          <div className="hero__progress">
            <div className="hero__progress-top">
              <span>Sua simulação</span>
              <b>{state.decidedMatches} / {totalSlots} jogos</b>
            </div>
            <div className="bar">
              <motion.span animate={{ width: `${globalPct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
          {champ && (
            <motion.div className="hero__champ" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <TeamBadge team={champ} size={40} />
              <div>
                <small>Seu campeão</small>
                <b>{champ.name}</b>
              </div>
            </motion.div>
          )}
        </div>

        <div className="format">
          {def.stages.map((s, i) => (
            <div key={s.id} className="format__step">
              <div className="format__name">{s.name}</div>
              <div className="format__desc">
                {s.type === 'swiss'
                  ? `Suíço · 16 times · ${s.invited.length < 16 ? '8 convidados + 8 classificados' : 'todos convidados'}`
                  : `Mata-mata · ${s.size} times · MD3`}
              </div>
              <div className="format__dates">{s.dates}</div>
              {i < def.stages.length - 1 && <span className="format__arrow">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
