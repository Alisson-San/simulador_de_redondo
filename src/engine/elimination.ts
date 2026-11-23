import type { EliminationStageDef, Match, Results, StageState } from './types';

/** Ordem clássica de chaveamento: para 8 => [1,8,4,5,2,7,3,6] */
export function bracketOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2 + 1;
    order = order.flatMap((s) => [s, n - s]);
  }
  return order;
}

export function computeElimination(def: EliminationStageDef, entrants: (string | null)[], results: Results): StageState {
  const order = bracketOrder(def.size);
  const slots: (string | null)[] = order.map((seed) => entrants[seed - 1] ?? null);
  const rounds: Match[][] = [];
  let current = slots;
  let r = 1;
  const placements: Record<string, string> = {};
  const totalRounds = Math.log2(def.size);

  while (current.length > 1) {
    const matches: Match[] = [];
    const next: (string | null)[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      const id = `${def.id}:r${r}:m${i / 2}`;
      const m: Match = {
        id,
        stageId: def.id,
        round: r,
        a,
        b,
        bestOf: def.bestOf[r - 1] ?? def.bestOf[def.bestOf.length - 1],
        label: def.roundNames[r - 1] ?? `Rodada ${r}`,
      };
      const res = results[id];
      if (a && b && res && (res.winner === a || res.winner === b)) m.result = res;
      matches.push(m);
      next.push(m.result ? m.result.winner : null);
      if (m.result) {
        const loser = m.result.winner === a ? b! : a!;
        const reached = def.size / 2 ** (r - 1);
        placements[loser] = reached === 2 ? '2º' : `${reached / 2 + 1}º–${reached}º`;
      }
    }
    rounds.push(matches);
    current = next;
    r++;
  }
  const champion = current[0] ?? undefined;
  if (champion) placements[champion] = '1º';
  void totalRounds;

  return {
    def,
    entrants: entrants.filter(Boolean) as string[],
    ready: entrants.filter(Boolean).length === def.size,
    complete: !!champion,
    rounds,
    standings: [],
    qualified: champion ? [champion] : [],
    eliminated: Object.keys(placements).filter((t) => t !== champion),
    champion,
    placements,
  };
}
