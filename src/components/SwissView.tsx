import { AnimatePresence, motion } from 'framer-motion';
import type { StageState, SwissStageDef } from '../engine/types';
import type { TournamentApi } from '../state';
import { MatchCard } from './MatchCard';
import { TeamBadge } from './TeamBadge';

export function SwissView({ stage, api, prevName, prevId }: { stage: StageState; api: TournamentApi; prevName?: string; prevId?: string }) {
  const def = stage.def as SwissStageDef;
  const maxRounds = def.winsToAdvance + def.lossesToEliminate - 1;

  if (!stage.ready) {
    return (
      <div className="locked">
        <div className="locked__icon">🔒</div>
        <h3>Aguardando {prevName}</h3>
        <p>Os 8 convidados já estão garantidos. Os outros 8 saem da fase anterior — escolha ou simule os resultados lá.</p>
        <div className="locked__teams">
          {stage.entrants.map((id, i) => (
            <div key={id} className="seedpill">
              <span className="seedpill__n">#{i + 1}</span>
              <TeamBadge team={api.teamMap.get(id)} size={22} />
              {api.teamMap.get(id)?.name}
            </div>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="seedpill seedpill--empty">
              <span className="seedpill__n">#{stage.entrants.length + i + 1}</span>
              <TeamBadge size={22} /> Classificado do {prevName}
            </div>
          ))}
        </div>
        <button className="btn btn--primary" onClick={() => prevId && api.simulateThrough(prevId)}>
          🎲 Simular {prevName}
        </button>
      </div>
    );
  }

  const advancedRows = stage.standings.filter((s) => s.status === 'advanced');
  const elimRows = stage.standings.filter((s) => s.status === 'eliminated');

  return (
    <div className="swiss">
      <div className="rounds" role="list">
        {Array.from({ length: maxRounds }).map((_, ri) => {
          const matches = stage.rounds[ri];
          const groups = new Map<string, typeof matches>();
          matches?.forEach((m) => groups.set(m.label, [...(groups.get(m.label) ?? []), m]));
          const pending = matches?.filter((m) => !m.result).length ?? 0;
          return (
            <section className="round" key={ri} role="listitem">
              <header className="round__head">
                <h3>Rodada {ri + 1}</h3>
                {matches && pending > 0 && (
                  <button className="btn btn--ghost btn--sm" onClick={() => api.simulate({ onlyMatchIds: matches.map((m) => m.id) })}>
                    🎲 Rodada
                  </button>
                )}
                {matches && pending === 0 && <span className="round__ok">✓</span>}
              </header>
              {!matches && <div className="round__empty">Pareamentos saem quando a rodada {ri} terminar</div>}
              {[...groups.entries()].map(([label, ms]) => (
                <div className="pool" key={label}>
                  <div className="pool__label">{label}</div>
                  <AnimatePresence mode="popLayout">
                    {ms.map((m) => (
                      <MatchCard key={m.id} match={m} teamMap={api.teamMap} onResult={api.setResult} onSim={(id) => api.simulate({ onlyMatchIds: [id] })} />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </section>
          );
        })}
        <section className="round round--final">
          <header className="round__head">
            <h3>Desfecho</h3>
          </header>
          <div className="outcome outcome--adv">
            <div className="outcome__title">Classificados</div>
            {Array.from({ length: def.lossesToEliminate }).map((_, l) => {
              const rows = advancedRows.filter((r) => r.losses === l);
              return (
                <div key={l} className="outcome__group">
                  <span className="outcome__rec">{def.winsToAdvance}-{l}</span>
                  <AnimatePresence>
                    {rows.map((r) => (
                      <motion.span key={r.teamId} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} title={api.teamMap.get(r.teamId)?.name}>
                        <TeamBadge team={api.teamMap.get(r.teamId)} size={30} />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="outcome outcome--elim">
            <div className="outcome__title">Eliminados</div>
            {Array.from({ length: def.winsToAdvance }).map((_, w) => {
              const rows = elimRows.filter((r) => r.wins === w);
              return (
                <div key={w} className="outcome__group">
                  <span className="outcome__rec">{w}-{def.lossesToEliminate}</span>
                  <AnimatePresence>
                    {rows.map((r) => (
                      <motion.span key={r.teamId} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} title={api.teamMap.get(r.teamId)?.name}>
                        <TeamBadge team={api.teamMap.get(r.teamId)} size={30} />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="panel standings">
        <div className="panel__head">
          <h3>Classificação</h3>
          <span className="muted">Desempate: campanha → Buchholz → seed</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th className="left">Time</th>
              <th>V-D</th>
              <th title="Soma de (vitórias − derrotas) dos adversários">Buch.</th>
              <th className="hide-sm">Campanha</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stage.standings.map((s, i) => {
              const t = api.teamMap.get(s.teamId)!;
              return (
                <motion.tr layout key={s.teamId} className={`st-${s.status}`} transition={{ type: 'spring', stiffness: 500, damping: 40 }}>
                  <td className="muted">{i + 1}</td>
                  <td className="left">
                    <span className="tcell">
                      <TeamBadge team={t} size={24} />
                      <span>{t.name}</span>
                      <span className="seed">#{s.seed}</span>
                    </span>
                  </td>
                  <td className="mono">{s.wins}-{s.losses}</td>
                  <td className="mono">{s.buchholz > 0 ? `+${s.buchholz}` : s.buchholz}</td>
                  <td className="hide-sm">
                    <span className="hist">
                      {s.history.map((h, j) => (
                        <i key={j} className={h === 'W' ? 'w' : 'l'}>{h === 'W' ? 'V' : 'D'}</i>
                      ))}
                    </span>
                  </td>
                  <td>
                    <span className={`status status--${s.status}`}>
                      {s.status === 'advanced' ? 'Classificado' : s.status === 'eliminated' ? 'Eliminado' : 'Na disputa'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
