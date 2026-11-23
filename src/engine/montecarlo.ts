import { simulateFrom } from './simulate';
import { computeTournament } from './tournament';
import type { Results, Team, TournamentDef } from './types';

export interface TeamOdds {
  teamId: string;
  /** chance de avançar em cada fase, indexada por stageId */
  advance: Record<string, number>;
  /** chance de 3-0 / 0-3 em fases suíças */
  perfect: Record<string, number>;
  winless: Record<string, number>;
  playoffs: number;
  semis: number;
  final: number;
  champion: number;
}

/** Simula N torneios a partir dos resultados atuais (respeita as escolhas do usuário). */
export function runMonteCarlo(def: TournamentDef, teams: Team[], results: Results, n: number, seed = Date.now()): TeamOdds[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const rng = mulberry32(seed);
  const acc = new Map<string, TeamOdds>();
  for (const t of teams)
    acc.set(t.id, { teamId: t.id, advance: {}, perfect: {}, winless: {}, playoffs: 0, semis: 0, final: 0, champion: 0 });
  const bump = (rec: Record<string, number>, k: string) => (rec[k] = (rec[k] ?? 0) + 1);

  for (let i = 0; i < n; i++) {
    const res = simulateFrom(def, teamMap, results, { mode: 'weighted', rng });
    const st = computeTournament(def, res);
    for (const s of st.stages) {
      if (s.def.type === 'swiss') {
        for (const q of s.qualified) bump(acc.get(q)!.advance, s.def.id);
        for (const row of s.standings) {
          const o = acc.get(row.teamId)!;
          if (row.wins === s.def.winsToAdvance && row.losses === 0) bump(o.perfect, s.def.id);
          if (row.losses === s.def.lossesToEliminate && row.wins === 0) bump(o.winless, s.def.id);
        }
      } else {
        const rounds = s.rounds;
        for (const m of rounds[0] ?? []) for (const t of [m.a, m.b]) if (t) acc.get(t)!.playoffs++;
        const sf = rounds[rounds.length - 2];
        for (const m of sf ?? []) for (const t of [m.a, m.b]) if (t) acc.get(t)!.semis++;
        const f = rounds[rounds.length - 1];
        for (const m of f ?? []) for (const t of [m.a, m.b]) if (t) acc.get(t)!.final++;
        if (s.champion) acc.get(s.champion)!.champion++;
      }
    }
  }
  const norm = (rec: Record<string, number>) => Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, v / n]));
  return [...acc.values()].map((o) => ({
    ...o,
    advance: norm(o.advance),
    perfect: norm(o.perfect),
    winless: norm(o.winless),
    playoffs: o.playoffs / n,
    semis: o.semis / n,
    final: o.final / n,
    champion: o.champion / n,
  }));
}

export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
