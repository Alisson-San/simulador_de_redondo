import { motion } from 'framer-motion';
import type { StageState } from '../engine/types';
import type { TournamentApi } from '../state';
import { MatchCard } from './MatchCard';
import { TeamBadge } from './TeamBadge';

export function BracketView({ stage, api, prevName, prevId }: { stage: StageState; api: TournamentApi; prevName?: string; prevId?: string }) {
  const champ = stage.champion ? api.teamMap.get(stage.champion) : undefined;
  return (
    <div className="bracket-wrap">
      {!stage.ready && (
        <div className="notice">
          🔒 Os confrontos aparecem quando o {prevName} terminar. Seeds: 3-0 primeiro, depois 3-1 e 3-2 (desempate por Buchholz).
          {prevId && (
            <button className="btn btn--primary btn--sm" onClick={() => api.simulateThrough(prevId)}>
              🎲 Simular {prevName}
            </button>
          )}
        </div>
      )}
      <div className="bracket">
        {stage.rounds.map((round, ri) => (
          <div className={`bcol bcol--r${ri}`} key={ri}>
            <h3 className="bcol__title">{round[0]?.label}</h3>
            <div className="bcol__matches">
              {round.map((m) => (
                <div className="bslot" key={m.id}>
                  <MatchCard match={m} teamMap={api.teamMap} onResult={api.setResult} onSim={(id) => api.simulate({ onlyMatchIds: [id] })} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="bcol bcol--champ">
          <h3 className="bcol__title">Campeão</h3>
          <div className="bcol__matches">
            <motion.div
              className={`champion ${champ ? 'is-set' : ''}`}
              key={champ?.id ?? 'none'}
              initial={{ scale: 0.8, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={champ ? ({ '--tc': champ.colors[0] } as Record<string, string>) : undefined}
            >
              <div className="champion__trophy">🏆</div>
              <TeamBadge team={champ} size={72} />
              <div className="champion__name">{champ?.name ?? 'A definir'}</div>
              {champ && <div className="champion__sub">Campeão do Major</div>}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
