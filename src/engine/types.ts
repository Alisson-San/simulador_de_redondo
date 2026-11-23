// Tipos centrais do motor de torneios. Tudo aqui é independente de UI,
// para que qualquer campeonato (CS, R6, Valorant...) seja descrito só com dados.

export type BestOf = 1 | 3 | 5;

export interface Team {
  id: string;
  name: string;
  tag: string; // sigla curta exibida no emblema
  region: 'Europa' | 'Américas' | 'Ásia' | 'CIS' | 'Oceania';
  country?: string; // emoji de bandeira
  rating: number; // força estimada (escala tipo Elo)
  colors: [string, string];
}

export interface MatchResult {
  winner: string;
  /** placar em mapas na ordem [a, b] */
  score: [number, number];
}

export type Results = Record<string, MatchResult>;

export interface Match {
  id: string;
  stageId: string;
  round: number; // 1-based
  a: string | null;
  b: string | null;
  bestOf: BestOf;
  /** rótulo do grupo/pool (ex.: "2-1", "Quartas") */
  label: string;
  /** partida que decide classificação ou eliminação */
  decisive?: 'advance' | 'eliminate' | 'both';
  result?: MatchResult;
}

// ---------- Definições de fases ----------

export interface EntrantSource {
  /** fase de onde vêm os classificados */
  stageId: string;
}

interface StageBase {
  id: string;
  name: string;
  short: string;
  dates?: string;
  /** times convidados diretamente, na ordem de seed */
  invited: string[];
  /** classificados vindos de outra fase (entram após os convidados) */
  from?: EntrantSource;
}

export interface SwissStageDef extends StageBase {
  type: 'swiss';
  winsToAdvance: number;
  lossesToEliminate: number;
  bestOf: { normal: BestOf; decisive: BestOf };
  /** regra de pareamento da 1ª rodada */
  firstRound: 'half' | 'fold'; // half: 1x9, 2x10... | fold: 1x16, 2x15...
}

export interface EliminationStageDef extends StageBase {
  type: 'single-elim';
  size: number; // potência de 2
  bestOf: BestOf[]; // por rodada
  roundNames: string[];
}

export type StageDef = SwissStageDef | EliminationStageDef;

export interface TournamentDef {
  id: string;
  name: string;
  game: string;
  organizer: string;
  location: string;
  dates: string;
  startDate: string; // ISO
  prizePool: string;
  accent: [string, string];
  teams: Team[];
  stages: StageDef[];
}

// ---------- Estado computado ----------

export interface SwissStanding {
  teamId: string;
  seed: number;
  wins: number;
  losses: number;
  buchholz: number;
  opponents: string[];
  history: ('W' | 'L')[];
  status: 'advanced' | 'eliminated' | 'alive';
  mapDiff: number;
}

export interface StageState {
  def: StageDef;
  entrants: string[]; // seed order; vazio se ainda não definido
  ready: boolean; // todos os participantes conhecidos
  complete: boolean;
  rounds: Match[][];
  standings: SwissStanding[]; // só swiss
  qualified: string[]; // em ordem de seed para a próxima fase
  eliminated: string[];
  champion?: string;
  /** colocação final por time (ex.: "9-11º") */
  placements: Record<string, string>;
}

export interface TournamentState {
  stages: StageState[];
  champion?: string;
  totalMatches: number;
  decidedMatches: number;
}
