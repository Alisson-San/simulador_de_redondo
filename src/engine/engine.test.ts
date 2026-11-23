import { describe, expect, it } from 'vitest';
import { csMajorSingapore2026 as def } from '../data/cs-major-singapore-2026';
import { bracketOrder } from './elimination';
import { mulberry32 } from './montecarlo';
import { seriesWinProb, simulateFrom } from './simulate';
import { computeTournament } from './tournament';

const teams = new Map(def.teams.map((t) => [t.id, t]));

describe('motor', () => {
  it('round 1 do Stage 1 segue 1x9, 2x10...', () => {
    const st = computeTournament(def, {});
    const r1 = st.stages[0].rounds[0];
    expect(r1).toHaveLength(8);
    expect(r1[0].a).toBe('nip');
    expect(r1[0].b).toBe('m80');
    expect(st.stages[1].ready).toBe(false);
  });

  it('simula torneio completo sem revanches no suíço e com 8 classificados', () => {
    for (let s = 1; s <= 30; s++) {
      const res = simulateFrom(def, teams, {}, { mode: 'weighted', rng: mulberry32(s) });
      const st = computeTournament(def, res);
      expect(st.champion).toBeTruthy();
      for (const stage of st.stages.slice(0, 3)) {
        expect(stage.complete).toBe(true);
        expect(stage.qualified).toHaveLength(8);
        expect(stage.rounds.length).toBe(5);
        for (const row of stage.standings) expect(new Set(row.opponents).size).toBe(row.opponents.length);
      }
      expect(st.decidedMatches).toBe(st.totalMatches);
    }
  });

  it('chave e probabilidades', () => {
    expect(bracketOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(seriesWinProb(0.6, 3)).toBeCloseTo(0.648, 3);
    expect(seriesWinProb(0.5, 5)).toBeCloseTo(0.5, 5);
  });
});
