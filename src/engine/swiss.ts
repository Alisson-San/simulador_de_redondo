import type { Match, Results, SwissStageDef, SwissStanding, StageState } from './types';

const matchId = (stageId: string, round: number, a: string, b: string) => `${stageId}:r${round}:${a}~${b}`;

function buchholz(s: SwissStanding, map: Map<string, SwissStanding>) {
  // Regra Valve: soma de (vitórias - derrotas) dos adversários enfrentados
  return s.opponents.reduce((acc, o) => {
    const op = map.get(o)!;
    return acc + op.wins - op.losses;
  }, 0);
}

function sortGroup(group: SwissStanding[]) {
  return group.sort((x, y) => y.buchholz - x.buchholz || x.seed - y.seed);
}

/**
 * Pareia um grupo (já ordenado do melhor para o pior) no padrão
 * "mais alto x mais baixo", evitando revanches com backtracking.
 */
function pairGroup(group: SwissStanding[]): [SwissStanding, SwissStanding][] | null {
  if (group.length === 0) return [];
  const [top, ...rest] = group;
  for (let i = rest.length - 1; i >= 0; i--) {
    const opp = rest[i];
    if (top.opponents.includes(opp.teamId)) continue;
    const remaining = rest.filter((_, j) => j !== i);
    const sub = pairGroup(remaining);
    if (sub) return [[top, opp], ...sub];
  }
  return null;
}

function pairGroupLenient(group: SwissStanding[]): [SwissStanding, SwissStanding][] {
  const strict = pairGroup(group);
  if (strict) return strict;
  // sem saída sem revanche: aceita revanche mantendo o padrão alto x baixo
  const out: [SwissStanding, SwissStanding][] = [];
  const g = [...group];
  while (g.length >= 2) out.push([g.shift()!, g.pop()!]);
  return out;
}

export function computeSwiss(def: SwissStageDef, entrants: string[], results: Results): StageState {
  const W = def.winsToAdvance;
  const L = def.lossesToEliminate;
  const table = new Map<string, SwissStanding>();
  entrants.forEach((teamId, i) =>
    table.set(teamId, { teamId, seed: i + 1, wins: 0, losses: 0, buchholz: 0, opponents: [], history: [], status: 'alive', mapDiff: 0 }),
  );

  const rounds: Match[][] = [];
  const advanced: string[] = [];
  const eliminated: string[] = [];
  const maxRounds = W + L - 1;
  let complete = false;

  for (let r = 1; r <= maxRounds; r++) {
    const alive = [...table.values()].filter((s) => s.status === 'alive');
    if (alive.length < 2) break;
    for (const s of table.values()) s.buchholz = buchholz(s, table);

    let pairs: [SwissStanding, SwissStanding][] = [];
    if (r === 1) {
      const sorted = [...alive].sort((x, y) => x.seed - y.seed);
      const n = sorted.length;
      for (let i = 0; i < n / 2; i++) {
        const opp = def.firstRound === 'half' ? sorted[i + n / 2] : sorted[n - 1 - i];
        pairs.push([sorted[i], opp]);
      }
    } else {
      // grupos por campanha, do melhor para o pior; sobra desce para o grupo seguinte
      const keys = [...new Set(alive.map((s) => `${s.wins}-${s.losses}`))].sort((a, b) => {
        const [aw, al] = a.split('-').map(Number);
        const [bw, bl] = b.split('-').map(Number);
        return bw - aw || al - bl;
      });
      let carry: SwissStanding[] = [];
      for (const k of keys) {
        const group = sortGroup([...carry, ...alive.filter((s) => `${s.wins}-${s.losses}` === k)]);
        carry = [];
        if (group.length % 2 === 1) carry = [group.pop()!];
        pairs.push(...pairGroupLenient(group));
      }
    }

    const roundMatches: Match[] = pairs.map(([x, y]) => {
      const [a, b] = x.seed <= y.seed ? [x, y] : [y, x];
      const advance = a.wins === W - 1;
      const elim = a.losses === L - 1;
      const decisive = advance && elim ? 'both' : advance ? 'advance' : elim ? 'eliminate' : undefined;
      const id = matchId(def.id, r, a.teamId, b.teamId);
      const m: Match = {
        id,
        stageId: def.id,
        round: r,
        a: a.teamId,
        b: b.teamId,
        label: `${a.wins}-${a.losses}`,
        bestOf: decisive ? def.bestOf.decisive : def.bestOf.normal,
        decisive,
      };
      const res = results[id];
      if (res && (res.winner === a.teamId || res.winner === b.teamId)) m.result = res;
      return m;
    });
    roundMatches.sort((m1, m2) => {
      const [w1, l1] = m1.label.split('-').map(Number);
      const [w2, l2] = m2.label.split('-').map(Number);
      return w2 - w1 || l1 - l2;
    });
    rounds.push(roundMatches);

    if (roundMatches.some((m) => !m.result)) break;

    for (const m of roundMatches) {
      const sa = table.get(m.a!)!;
      const sb = table.get(m.b!)!;
      sa.opponents.push(sb.teamId);
      sb.opponents.push(sa.teamId);
      const winner = m.result!.winner === sa.teamId ? sa : sb;
      const loser = winner === sa ? sb : sa;
      winner.wins++;
      winner.history.push('W');
      loser.losses++;
      loser.history.push('L');
      const [ma, mb] = m.result!.score;
      sa.mapDiff += ma - mb;
      sb.mapDiff += mb - ma;
    }
    for (const s of table.values()) {
      if (s.status !== 'alive') continue;
      if (s.wins >= W) {
        s.status = 'advanced';
        advanced.push(s.teamId);
      } else if (s.losses >= L) {
        s.status = 'eliminated';
        eliminated.push(s.teamId);
      }
    }
    if ([...table.values()].every((s) => s.status !== 'alive')) complete = true;
  }

  for (const s of table.values()) s.buchholz = buchholz(s, table);

  const standings = [...table.values()].sort(
    (x, y) => y.wins - x.wins || x.losses - y.losses || y.buchholz - x.buchholz || y.mapDiff - x.mapDiff || x.seed - y.seed,
  );

  // classificados em ordem: campanha, depois Buchholz, depois seed
  const qualified = complete ? standings.filter((s) => s.status === 'advanced').map((s) => s.teamId) : [];

  const placements: Record<string, string> = {};
  if (complete) {
    // colocação por campanha dentro da fase (ex.: eliminados 2-3 => 9-11º)
    let pos = 1;
    const byRecord = new Map<string, string[]>();
    standings.forEach((s) => {
      const k = `${s.wins}-${s.losses}`;
      byRecord.set(k, [...(byRecord.get(k) ?? []), s.teamId]);
    });
    for (const [rec, ids] of byRecord) {
      const label = ids.length > 1 ? `${pos}º–${pos + ids.length - 1}º` : `${pos}º`;
      ids.forEach((id) => (placements[id] = `${label} (${rec})`));
      pos += ids.length;
    }
  }

  return {
    def,
    entrants,
    ready: true,
    complete,
    rounds,
    standings,
    qualified,
    eliminated: complete ? standings.filter((s) => s.status === 'eliminated').map((s) => s.teamId) : eliminated,
    placements,
  };
}
