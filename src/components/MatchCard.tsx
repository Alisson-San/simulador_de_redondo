import { motion } from 'framer-motion';
import { matchProb } from '../engine/simulate';
import type { Match, MatchResult, Team } from '../engine/types';
import { TeamBadge } from './TeamBadge';

interface Props {
  match: Match;
  teamMap: Map<string, Team>;
  onResult: (id: string, r: MatchResult | undefined) => void;
  onSim: (id: string) => void;
  compact?: boolean;
}

const pct = (p: number) => `${Math.round(p * 100)}%`;

export function MatchCard({ match, teamMap, onResult, onSim, compact }: Props) {
  const ta = match.a ? teamMap.get(match.a) : undefined;
  const tb = match.b ? teamMap.get(match.b) : undefined;
  const playable = !!(ta && tb);
  const res = match.result;
  const need = Math.ceil(match.bestOf / 2);
  const pA = playable ? matchProb(teamMap, match) : 0.5;

  const pick = (side: 'a' | 'b') => {
    if (!playable) return;
    const id = side === 'a' ? ta!.id : tb!.id;
    if (res?.winner === id) {
      // clicar no vencedor de novo: MD3/MD5 alterna placar apertado; MD1 limpa
      if (match.bestOf === 1) return onResult(match.id, undefined);
      const loserMaps = side === 'a' ? res.score[1] : res.score[0];
      if (loserMaps + 1 >= need) return onResult(match.id, undefined);
      const nl = loserMaps + 1;
      return onResult(match.id, { winner: id, score: side === 'a' ? [need, nl] : [nl, need] });
    }
    onResult(match.id, { winner: id, score: side === 'a' ? [need, 0] : [0, need] });
  };

  const row = (side: 'a' | 'b', team: Team | undefined, p: number) => {
    const won = res && team && res.winner === team.id;
    const lost = res && team && res.winner !== team.id;
    const score = res ? (side === 'a' ? res.score[0] : res.score[1]) : null;
    return (
      <button
        className={`mrow ${won ? 'is-win' : ''} ${lost ? 'is-loss' : ''}`}
        onClick={() => pick(side)}
        disabled={!playable}
        title={team ? `${team.name} — clique para escolher o vencedor` : 'A definir'}
        style={team ? ({ '--tc': team.colors[0] } as React.CSSProperties) : undefined}
      >
        <TeamBadge team={team} size={compact ? 24 : 28} />
        <span className="mrow__name">{team ? (compact ? team.tag : team.name) : 'A definir'}</span>
        {playable && !res && <span className="mrow__prob">{pct(p)}</span>}
        {score !== null && (
          <motion.span key={`${score}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mrow__score">
            {score}
          </motion.span>
        )}
        {won && <motion.span layoutId={`win-${match.id}`} className="mrow__glow" />}
      </button>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`match ${res ? 'is-done' : ''} ${match.decisive ? `is-${match.decisive}` : ''} ${compact ? 'is-compact' : ''}`}
    >
      <div className="match__meta">
        <span className={`chip chip--bo${match.bestOf}`}>MD{match.bestOf}</span>
        {match.decisive === 'advance' && <span className="chip chip--adv">Vaga</span>}
        {match.decisive === 'eliminate' && <span className="chip chip--elim">Eliminação</span>}
        {match.decisive === 'both' && <span className="chip chip--both">Decisivo</span>}
        <span className="match__actions">
          {playable && (
            <button className="icon-btn" onClick={() => onSim(match.id)} title="Simular esta partida" aria-label="Simular partida">
              🎲
            </button>
          )}
          {res && (
            <button className="icon-btn" onClick={() => onResult(match.id, undefined)} title="Limpar resultado" aria-label="Limpar">
              ✕
            </button>
          )}
        </span>
      </div>
      {row('a', ta, pA)}
      {row('b', tb, 1 - pA)}
      {playable && !res && (
        <div className="probbar" title={`Chance estimada: ${pct(pA)} x ${pct(1 - pA)}`}>
          <span style={{ width: pct(pA), background: ta!.colors[0] }} />
          <span style={{ width: pct(1 - pA), background: tb!.colors[0] }} />
        </div>
      )}
    </motion.div>
  );
}
