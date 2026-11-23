import { computeElimination } from './elimination';
import { computeSwiss } from './swiss';
import type { Results, StageState, TournamentDef, TournamentState } from './types';

/**
 * Calcula todo o estado do torneio a partir apenas dos resultados escolhidos.
 * Função pura: mudar um resultado antigo recalcula pareamentos seguintes,
 * e resultados de confrontos que deixaram de existir são ignorados.
 */
export function computeTournament(def: TournamentDef, results: Results): TournamentState {
  const byId = new Map<string, StageState>();
  const stages: StageState[] = [];

  for (const sd of def.stages) {
    const src = sd.from ? byId.get(sd.from.stageId) : undefined;
    const fromQualified = src ? src.qualified : [];
    const waiting = !!sd.from && !(src && src.complete);
    let st: StageState;

    if (sd.type === 'swiss') {
      if (waiting) {
        st = {
          def: sd,
          entrants: [...sd.invited],
          ready: false,
          complete: false,
          rounds: [],
          standings: [],
          qualified: [],
          eliminated: [],
          placements: {},
        };
      } else {
        st = computeSwiss(sd, [...sd.invited, ...fromQualified], results);
      }
    } else {
      const entrants = waiting ? [] : [...sd.invited, ...fromQualified];
      st = computeElimination(sd, entrants, results);
      if (waiting) st.ready = false;
    }
    byId.set(sd.id, st);
    stages.push(st);
  }

  let total = 0;
  let decided = 0;
  for (const s of stages) {
    for (const r of s.rounds) for (const m of r) {
      if (m.a && m.b) total++;
      if (m.result) decided++;
    }
  }
  const last = stages[stages.length - 1];
  return { stages, champion: last?.champion, totalMatches: total, decidedMatches: decided };
}

/** Partidas jogáveis agora (ambos os times definidos, sem resultado). */
export function pendingMatches(state: TournamentState, stageId?: string) {
  const out = [];
  for (const s of state.stages) {
    if (stageId && s.def.id !== stageId) continue;
    for (const r of s.rounds) for (const m of r) if (m.a && m.b && !m.result) out.push(m);
  }
  return out;
}
