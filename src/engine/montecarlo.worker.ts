import { runMonteCarlo } from './montecarlo';
import type { Results, Team, TournamentDef } from './types';

self.onmessage = (e: MessageEvent<{ def: TournamentDef; teams: Team[]; results: Results; n: number }>) => {
  const { def, teams, results, n } = e.data;
  const odds = runMonteCarlo(def, teams, results, n);
  (self as unknown as Worker).postMessage(odds);
};
