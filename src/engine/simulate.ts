import { computeTournament, pendingMatches } from './tournament';
import type { BestOf, Match, MatchResult, Results, Team, TournamentDef } from './types';

export type SimMode = 'weighted' | 'favorite' | 'coin';

/** Probabilidade de A vencer UM mapa (curva logística estilo Elo). */
export function mapWinProb(ra: number, rb: number) {
  return 1 / (1 + 10 ** ((rb - ra) / 400));
}

/** Probabilidade de vencer a série MDx dado p por mapa. */
export function seriesWinProb(p: number, bo: BestOf) {
  const need = Math.ceil(bo / 2);
  // soma sobre quantos mapas o adversário vence antes do último mapa do vencedor
  let total = 0;
  for (let k = 0; k < need; k++) total += binom(need - 1 + k, k) * p ** need * (1 - p) ** k;
  return total;
}

function binom(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

export function matchProb(teams: Map<string, Team>, m: Pick<Match, 'a' | 'b' | 'bestOf'>) {
  const ta = teams.get(m.a!);
  const tb = teams.get(m.b!);
  if (!ta || !tb) return 0.5;
  return seriesWinProb(mapWinProb(ta.rating, tb.rating), m.bestOf);
}

export function simulateMatch(teams: Map<string, Team>, m: Match, mode: SimMode, rng = Math.random): MatchResult {
  const ta = teams.get(m.a!)!;
  const tb = teams.get(m.b!)!;
  const need = Math.ceil(m.bestOf / 2);
  if (mode === 'favorite') {
    const aFav = ta.rating >= tb.rating;
    const p = mapWinProb(Math.max(ta.rating, tb.rating), Math.min(ta.rating, tb.rating));
    const loserMaps = need > 1 && p < 0.7 ? 1 : 0;
    return aFav ? { winner: ta.id, score: [need, loserMaps] } : { winner: tb.id, score: [loserMaps, need] };
  }
  const p = mode === 'coin' ? 0.5 : mapWinProb(ta.rating, tb.rating);
  let wa = 0;
  let wb = 0;
  while (wa < need && wb < need) {
    if (rng() < p) wa++;
    else wb++;
  }
  return { winner: wa > wb ? ta.id : tb.id, score: [wa, wb] };
}

/** Preenche partidas pendentes até o fim (ou só da fase indicada / só a próxima rodada). */
export function simulateFrom(
  def: TournamentDef,
  teams: Map<string, Team>,
  results: Results,
  opts: { mode: SimMode; stageId?: string; onlyMatchIds?: string[]; rng?: () => number } = { mode: 'weighted' },
): Results {
  const out: Results = { ...results };
  for (let guard = 0; guard < 200; guard++) {
    const state = computeTournament(def, out);
    let pend = pendingMatches(state, opts.stageId);
    if (opts.onlyMatchIds) pend = pend.filter((m) => opts.onlyMatchIds!.includes(m.id));
    if (pend.length === 0) break;
    for (const m of pend) out[m.id] = simulateMatch(teams, m, opts.mode, opts.rng);
    if (opts.onlyMatchIds) break;
  }
  return out;
}
