import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { simulateFrom, type SimMode } from './engine/simulate';
import { computeTournament } from './engine/tournament';
import type { MatchResult, Results, Team, TournamentDef } from './engine/types';

interface Saved {
  results: Results;
  ratings: Record<string, number>;
}

const key = (id: string) => `sdr:${id}:v1`;

function readHash(): Saved | null {
  const m = location.hash.match(/s=([^&]+)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
  } catch {
    return null;
  }
}

function load(id: string): Saved {
  const fromHash = readHash();
  if (fromHash) return { results: fromHash.results ?? {}, ratings: fromHash.ratings ?? {} };
  try {
    const raw = localStorage.getItem(key(id));
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage indisponível */
  }
  return { results: {}, ratings: {} };
}

/** Remove resultados de confrontos que deixaram de existir após mudanças anteriores. */
function prune(def: TournamentDef, results: Results): Results {
  const st = computeTournament(def, results);
  const valid: Results = {};
  for (const s of st.stages) for (const r of s.rounds) for (const m of r) if (m.result) valid[m.id] = m.result;
  return valid;
}

export function useTournament(base: TournamentDef) {
  const [saved, setSaved] = useState<Saved>(() => load(base.id));
  const history = useRef<Saved[]>([]);
  const [mode, setMode] = useState<SimMode>('weighted');

  const teams: Team[] = useMemo(
    () => base.teams.map((t) => (saved.ratings[t.id] ? { ...t, rating: saved.ratings[t.id] } : t)),
    [base, saved.ratings],
  );
  const def = useMemo(() => ({ ...base, teams }), [base, teams]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const state = useMemo(() => computeTournament(def, saved.results), [def, saved.results]);

  useEffect(() => {
    try {
      localStorage.setItem(key(base.id), JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [saved, base.id]);

  useEffect(() => {
    // link compartilhado é carregado uma vez e depois some da barra de endereço
    if (location.hash.includes('s=')) history.current = [];
    if (location.hash) window.history.replaceState(null, '', location.pathname + location.search);
  }, []);

  const commit = useCallback(
    (fn: (s: Saved) => Saved) =>
      setSaved((prev) => {
        history.current = [...history.current.slice(-49), prev];
        return fn(prev);
      }),
    [],
  );

  const setResult = useCallback(
    (matchId: string, result: MatchResult | undefined) =>
      commit((s) => {
        const r = { ...s.results };
        if (result) r[matchId] = result;
        else delete r[matchId];
        return { ...s, results: prune(def, r) };
      }),
    [commit, def],
  );

  const simulate = useCallback(
    (opts: { stageId?: string; onlyMatchIds?: string[] }) =>
      commit((s) => ({ ...s, results: simulateFrom(def, teamMap, s.results, { mode, ...opts }) })),
    [commit, def, teamMap, mode],
  );

  /** Simula todas as fases até (e incluindo) a fase indicada. */
  const simulateThrough = useCallback(
    (stageId: string) =>
      commit((s) => {
        let r = s.results;
        for (const st of def.stages) {
          r = simulateFrom(def, teamMap, r, { mode, stageId: st.id });
          if (st.id === stageId) break;
        }
        return { ...s, results: r };
      }),
    [commit, def, teamMap, mode],
  );

  const clear = useCallback(
    (stageId?: string) =>
      commit((s) => {
        if (!stageId) return { ...s, results: {} };
        const r = Object.fromEntries(Object.entries(s.results).filter(([k]) => !k.startsWith(stageId + ':')));
        return { ...s, results: prune(def, r) };
      }),
    [commit, def],
  );

  const setRating = useCallback(
    (teamId: string, rating: number | undefined) =>
      setSaved((s) => {
        const ratings = { ...s.ratings };
        if (rating === undefined) delete ratings[teamId];
        else ratings[teamId] = rating;
        return { ...s, ratings };
      }),
    [],
  );

  const resetRatings = useCallback(() => setSaved((s) => ({ ...s, ratings: {} })), []);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) setSaved(prev);
  }, []);

  const shareUrl = useCallback(() => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(saved))));
    return `${location.origin}${location.pathname}#s=${encodeURIComponent(payload)}`;
  }, [saved]);

  return {
    def,
    baseTeams: base.teams,
    teams,
    teamMap,
    state,
    results: saved.results,
    ratings: saved.ratings,
    mode,
    setMode,
    setResult,
    simulate,
    simulateThrough,
    clear,
    setRating,
    resetRatings,
    undo,
    canUndo: history.current.length > 0,
    shareUrl,
  };
}

export type TournamentApi = ReturnType<typeof useTournament>;
