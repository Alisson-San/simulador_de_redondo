import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BracketView } from './components/BracketView';
import { Confetti } from './components/Confetti';
import { Hero } from './components/Hero';
import { OddsView } from './components/OddsView';
import { SwissView } from './components/SwissView';
import { TeamsView } from './components/TeamsView';
import { tournaments } from './data';
import type { SimMode } from './engine/simulate';
import { useTournament } from './state';

const MODES: { id: SimMode; label: string; hint: string }[] = [
  { id: 'weighted', label: 'Realista', hint: 'Sorteio ponderado pela força dos times' },
  { id: 'favorite', label: 'Favoritos', hint: 'O time mais forte sempre vence' },
  { id: 'coin', label: 'Caos 50/50', hint: 'Qualquer um pode vencer' },
];

export default function App() {
  const api = useTournament(tournaments[0]);
  const { def, state } = api;
  const firstOpen = useMemo(() => {
    const idx = state.stages.findIndex((s) => s.ready && !s.complete);
    return idx === -1 ? state.stages[state.stages.length - 1].def.id : state.stages[idx].def.id;
    // só no carregamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tab, setTab] = useState<string>(firstOpen);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        api.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [api]);

  const stageIdx = state.stages.findIndex((s) => s.def.id === tab);
  const stage = stageIdx >= 0 ? state.stages[stageIdx] : undefined;
  const prev = stageIdx > 0 ? state.stages[stageIdx - 1] : undefined;
  const champ = state.champion ? api.teamMap.get(state.champion) : undefined;

  const share = async () => {
    const url = api.shareUrl();
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `Minha simulação — ${def.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash('🔗 Link da sua simulação copiado!');
    } catch {
      prompt('Copie o link:', url);
    }
  };

  const tabs = [
    ...state.stages.map((s) => ({
      id: s.def.id,
      label: s.def.name,
      state: s.complete ? 'done' : s.ready ? 'open' : 'locked',
    })),
    { id: 'odds', label: 'Probabilidades', state: 'extra' },
    { id: 'teams', label: 'Times', state: 'extra' },
  ];

  return (
    <div className="app" style={{ '--a1': def.accent[0], '--a2': def.accent[1] } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <img src="./favicon.svg" alt="" width={28} height={28} />
          <span>
            Simulador <em>de Redondo</em>
          </span>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ghost btn--sm" onClick={api.undo} disabled={!api.canUndo} title="Desfazer (Ctrl+Z)">
            ↶ <span className="hide-sm">Desfazer</span>
          </button>
          <button className="btn btn--ghost btn--sm" onClick={share} title="Compartilhar simulação">
            🔗 <span className="hide-sm">Compartilhar</span>
          </button>
        </div>
      </header>

      <Hero api={api} />

      <nav className="tabs" aria-label="Fases">
        <div className="tabs__inner">
          {tabs.map((t) => (
            <button key={t.id} className={`tab tab--${t.state} ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.state === 'done' && <span className="tab__ico">✓</span>}
              {t.state === 'locked' && <span className="tab__ico">🔒</span>}
              {t.state === 'open' && <span className="tab__dot" />}
              {t.label}
              {tab === t.id && <motion.span layoutId="tab-ind" className="tab__ind" />}
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        {stage && (
          <div className="toolbar">
            <div className="toolbar__info">
              <h2>{stage.def.name}</h2>
              <span className="muted">
                {stage.def.type === 'swiss'
                  ? `Suíço · ${stage.def.winsToAdvance} vitórias classificam, ${stage.def.lossesToEliminate} derrotas eliminam · ${
                      stage.def.bestOf.normal === stage.def.bestOf.decisive
                        ? `tudo MD${stage.def.bestOf.normal}`
                        : `MD${stage.def.bestOf.normal}, jogos de vaga/eliminação MD${stage.def.bestOf.decisive}`
                    }`
                  : 'Eliminação simples · MD3'}
                {stage.def.dates ? ` · ${stage.def.dates}` : ''}
              </span>
            </div>
            <div className="toolbar__actions">
              <div className="seg" role="radiogroup" aria-label="Modo de simulação">
                {MODES.map((m) => (
                  <button key={m.id} className={api.mode === m.id ? 'is-on' : ''} onClick={() => api.setMode(m.id)} title={m.hint}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button className="btn btn--primary" disabled={!stage.ready || stage.complete} onClick={() => api.simulate({ stageId: stage.def.id })}>
                🎲 Simular fase
              </button>
              <button className="btn btn--ghost" onClick={() => api.simulate({})} disabled={!!state.champion}>
                ⏩ Simular tudo
              </button>
              <button
                className="btn btn--ghost btn--danger"
                onClick={() => api.clear(stage.def.id)}
                disabled={!Object.keys(api.results).some((k) => k.startsWith(stage.def.id + ':'))}
              >
                ⟲ Limpar fase
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {stage && stage.def.type === 'swiss' && <SwissView stage={stage} api={api} prevName={prev?.def.name} prevId={prev?.def.id} />}
            {stage && stage.def.type === 'single-elim' && <BracketView stage={stage} api={api} prevName={prev?.def.name} prevId={prev?.def.id} />}
            {tab === 'odds' && <OddsView api={api} />}
            {tab === 'teams' && <TeamsView api={api} />}
          </motion.div>
        </AnimatePresence>

        {stage?.complete && stageIdx < state.stages.length - 1 && (
          <motion.div className="next-cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span>✓ {stage.def.name} definido!</span>
            <button className="btn btn--primary" onClick={() => setTab(state.stages[stageIdx + 1].def.id)}>
              Ir para {state.stages[stageIdx + 1].def.name} →
            </button>
          </motion.div>
        )}
      </main>

      <footer className="footer">
        <p>
          Dica: clique num time para dar a vitória · clique de novo no vencedor de uma MD3 para alternar 2-0 / 2-1 · 🎲 simula com base
          na força · Ctrl+Z desfaz.
        </p>
        <p className="muted">
          Projeto de fã, sem vínculo com Valve, PGL ou os times. Emblemas gerados automaticamente; forças são estimativas editáveis.
        </p>
      </footer>

      {champ && <Confetti colors={[champ.colors[0], champ.colors[1], def.accent[0], def.accent[1], '#ffffff']} burstKey={champ.id} />}

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
