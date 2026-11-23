import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { TeamOdds } from '../engine/montecarlo';
import type { TournamentApi } from '../state';
import { TeamBadge } from './TeamBadge';

const SIZES = [500, 2000, 5000];

function Cell({ v, na }: { v?: number; na?: string }) {
  if (na) return <td className="odds__na">{na}</td>;
  const p = v ?? 0;
  const label = p === 0 ? '0%' : p < 0.01 ? '<1%' : p > 0.995 && p < 1 ? '>99%' : `${Math.round(p * 100)}%`;
  return (
    <td className="odds__cell" style={{ '--p': p } as React.CSSProperties}>
      <span>{label}</span>
    </td>
  );
}

export function OddsView({ api }: { api: TournamentApi }) {
  const [odds, setOdds] = useState<TeamOdds[] | null>(null);
  const [running, setRunning] = useState(false);
  const [n, setN] = useState(2000);
  const [sortKey, setSortKey] = useState<string>('champion');
  const worker = useRef<Worker | null>(null);
  const stale = useRef(false);

  const run = () => {
    worker.current?.terminate();
    const w = new Worker(new URL('../engine/montecarlo.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setRunning(true);
    stale.current = false;
    w.onmessage = (e: MessageEvent<TeamOdds[]>) => {
      setOdds(e.data);
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ def: api.def, teams: api.teams, results: api.results, n });
  };

  useEffect(() => {
    run();
    return () => worker.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stale.current = true;
  }, [api.results, api.ratings]);

  const swiss = api.def.stages.filter((s) => s.type === 'swiss');
  const entersAt = new Map<string, string>();
  for (const s of api.def.stages) for (const t of s.invited) entersAt.set(t, s.id);

  const val = (o: TeamOdds, k: string) =>
    k.startsWith('adv:') ? (o.advance[k.slice(4)] ?? 0) : (o as unknown as Record<string, number>)[k] ?? 0;
  const rows = odds ? [...odds].sort((a, b) => val(b, sortKey) - val(a, sortKey) || b.final - a.final || b.playoffs - a.playoffs) : [];
  const th = (k: string, label: string, title?: string) => (
    <th className={`sortable ${sortKey === k ? 'is-sorted' : ''}`} onClick={() => setSortKey(k)} title={title}>
      {label}
    </th>
  );

  return (
    <div className="panel odds">
      <div className="panel__head odds__head">
        <div>
          <h3>Probabilidades (Monte Carlo)</h3>
          <p className="muted">
            Simula o restante do campeonato milhares de vezes a partir dos resultados que você já escolheu, usando a força de cada
            time (aba Times). Clique nas colunas para ordenar.
          </p>
        </div>
        <div className="odds__ctrl">
          <div className="seg">
            {SIZES.map((s) => (
              <button key={s} className={n === s ? 'is-on' : ''} onClick={() => setN(s)}>
                {s.toLocaleString('pt-BR')}
              </button>
            ))}
          </div>
          <button className="btn btn--primary" onClick={run} disabled={running}>
            {running ? <span className="spinner" /> : '⚡'} {running ? 'Simulando…' : stale.current && odds ? 'Recalcular' : 'Simular'}
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table className={running ? 'is-loading' : ''}>
          <thead>
            <tr>
              <th className="left">Time</th>
              {swiss.map((s) => th(`adv:${s.id}`, `Passa ${s.short}`, `Chance de avançar no ${s.name}`))}
              {th('playoffs', 'Playoffs')}
              {th('semis', 'Semi')}
              {th('final', 'Final')}
              {th('champion', 'Título 🏆')}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const t = api.teamMap.get(o.teamId)!;
              const start = api.def.stages.findIndex((s) => s.id === entersAt.get(o.teamId));
              return (
                <motion.tr layout key={o.teamId}>
                  <td className="left">
                    <span className="tcell">
                      <TeamBadge team={t} size={24} />
                      <span>{t.name}</span>
                    </span>
                  </td>
                  {swiss.map((s) => {
                    const idx = api.def.stages.findIndex((x) => x.id === s.id);
                    return <Cell key={s.id} v={o.advance[s.id]} na={idx < start ? 'convidado' : undefined} />;
                  })}
                  <Cell v={o.playoffs} />
                  <Cell v={o.semis} />
                  <Cell v={o.final} />
                  <Cell v={o.champion} />
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {!odds && <div className="round__empty">Calculando…</div>}
      </div>
    </div>
  );
}
