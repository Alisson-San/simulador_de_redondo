# CLAUDE.md — guia rápido para agentes de IA

> Leia ESTE arquivo primeiro. Só abra `docs/` quando a tarefa exigir. Não leia `node_modules/` nem `dist/`.

## O que é
Simulador web de campeonatos com **formato suíço + mata-mata** (começou pelo PGL Major Singapore 2026 de CS2).
SPA estática: **Vite + React 18 + TypeScript + framer-motion**. Sem backend. Estado salvo no `localStorage` e compartilhável por URL (`#s=`).

## Mapa do código (tudo em `src/`)
| Arquivo | Papel |
|---|---|
| `engine/types.ts` | Tipos: `Team`, `TournamentDef`, `StageDef` (`swiss` / `single-elim`), `Match`, `StageState` |
| `engine/swiss.ts` | Suíço estilo Valve: rodada 1 por seed (1x9), depois grupos por campanha, Buchholz, alto x baixo sem revanche |
| `engine/elimination.ts` | Mata-mata simples (chave 1x8, 4x5, 2x7, 3x6) |
| `engine/tournament.ts` | `computeTournament(def, results)` — **função pura**: resultados → estado inteiro |
| `engine/simulate.ts` | Probabilidade (Elo por mapa → série MDx) e simulação de partidas |
| `engine/montecarlo.ts` (+ `.worker.ts`) | N simulações em Web Worker → probabilidades por time |
| `data/*.ts` | Campeonatos pré-cadastrados; registrar em `data/index.ts` |
| `state.ts` | Hook `useTournament`: resultados, forças editadas, desfazer, compartilhar |
| `components/` | `SwissView`, `BracketView`, `MatchCard`, `OddsView`, `TeamsView`, `Hero`, `TeamBadge`, `Confetti` |
| `styles.css` | Todo o CSS (variáveis em `:root`, responsivo no fim) |

## Regras-chave
- **Fonte da verdade = `results: Record<matchId, {winner, score}>`.** Nunca guarde pareamentos; eles são derivados.
- IDs de partida suíça: `${stageId}:r${round}:${teamA}~${teamB}`; mata-mata: `${stageId}:r${round}:m${idx}`.
- Mudar um resultado antigo → `prune()` em `state.ts` descarta resultados que deixaram de existir.
- Fases se encadeiam via `from: { stageId }`: convidados (`invited`) viram seeds 1..n, classificados entram depois (ordem: campanha → Buchholz → seed).
- UI em **português (pt-BR)**. Emblemas são gerados (`TeamBadge`), **não** usar logos oficiais sem licença.

## Comandos
```bash
npm install        # 1ª vez
npm run dev        # http://localhost:5173
npm test           # vitest (motor)
npm run build      # tsc + vite build → dist/
```

## Tarefas comuns (onde mexer)
- **Novo campeonato** → copiar `src/data/cs-major-singapore-2026.ts`, ajustar times/fases, registrar em `src/data/index.ts`. Ver `docs/ADICIONAR_CAMPEONATO.md`.
- **Novo formato** (dupla eliminação, GSL, grupos) → novo `type` em `engine/types.ts`, função `computeX` em `engine/`, ramo em `engine/tournament.ts`, view em `components/`. Ver `docs/ARQUITETURA.md`.
- **Visual** → `styles.css` (+ componente). Testar em 1440px e 390px.
- **Força dos times** → `rating` em `data/*.ts` (escala Elo; +100 ≈ 64% por mapa).

## Checklist antes de commitar
`npm test && npm run build` sem erros. Não commitar `dist/` nem `node_modules/`.
