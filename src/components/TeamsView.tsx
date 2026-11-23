import { motion } from 'framer-motion';
import type { TournamentApi } from '../state';
import { TeamBadge } from './TeamBadge';

const tier = (r: number) => (r >= 1780 ? 'Elite' : r >= 1700 ? 'Forte' : r >= 1620 ? 'Competitivo' : r >= 1560 ? 'Azarão' : 'Zebra');

export function TeamsView({ api }: { api: TournamentApi }) {
  const base = new Map(api.baseTeams.map((t) => [t.id, t]));
  return (
    <div className="teams">
      <div className="panel__head teams__head">
        <div>
          <h3>Times e força</h3>
          <p className="muted">
            A força (escala tipo Elo) define as chances nas simulações. Ajuste à vontade — fica salvo no seu navegador.
            Diferença de 100 pontos ≈ 64% de chance por mapa.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={api.resetRatings} disabled={Object.keys(api.ratings).length === 0}>
          ↺ Restaurar padrão
        </button>
      </div>
      {api.def.stages
        .filter((s) => s.invited.length)
        .map((s) => (
          <section key={s.id} className="teams__group">
            <h4>
              Começam no {s.name} <span className="muted">· {s.invited.length} times</span>
            </h4>
            <div className="teams__grid">
              {s.invited.map((id, i) => {
                const t = api.teamMap.get(id)!;
                const edited = api.ratings[id] !== undefined;
                return (
                  <motion.div layout key={id} className="tcard" style={{ '--tc': t.colors[0] } as Record<string, string>}>
                    <div className="tcard__top">
                      <TeamBadge team={t} size={44} />
                      <div>
                        <div className="tcard__name">{t.name}</div>
                        <div className="muted small">
                          {t.country} {t.region} · seed #{i + 1}
                        </div>
                      </div>
                      <span className="tcard__tier">{tier(t.rating)}</span>
                    </div>
                    <label className="tcard__slider">
                      <span>
                        Força <b>{t.rating}</b>
                        {edited && (
                          <button className="link" onClick={() => api.setRating(id, undefined)}>
                            ↺ {base.get(id)!.rating}
                          </button>
                        )}
                      </span>
                      <input
                        type="range"
                        min={1400}
                        max={2000}
                        step={5}
                        value={t.rating}
                        onChange={(e) => api.setRating(id, Number(e.target.value))}
                      />
                    </label>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
