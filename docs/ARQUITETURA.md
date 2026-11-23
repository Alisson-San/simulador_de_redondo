# Arquitetura

## Fluxo de dados
```
TournamentDef (data/*.ts)  +  results (escolhas do usuário)
                 │
                 ▼
     computeTournament()  ── função pura, sem efeitos
                 │
                 ▼
TournamentState { stages[ { rounds[][], standings, qualified, champion } ] }
                 │
                 ▼
            Componentes React
```
- Clique num time → `setResult(matchId, {winner, score})` → recomputa tudo → `prune()` remove órfãos.
- 🎲 / "Simular fase" / "Simular tudo" → `simulateFrom()` preenche partidas pendentes em loop até não haver mais (cada rodada suíça depende da anterior).
- Probabilidades → `runMonteCarlo()` num Web Worker, condicionado aos resultados já escolhidos.

## Suíço (regras Valve, `engine/swiss.ts`)
1. Rodada 1: seed i x seed i+n/2 (`firstRound: 'half'`) ou i x n+1−i (`'fold'`).
2. Rodadas seguintes: times vivos agrupados por campanha (V-D). Dentro do grupo ordena por **Buchholz** (soma de V−D dos adversários) e depois seed.
3. Pareia mais alto x mais baixo, com backtracking para evitar revanche (se impossível, aceita revanche).
4. Grupo ímpar: o último desce para o grupo seguinte (não ocorre em 16 times 3/3).
5. MDx: `bestOf.decisive` quando a partida vale vaga ou eliminação; senão `bestOf.normal`.
6. Classificação final: V desc, D asc, Buchholz, saldo de mapas, seed.

## Mata-mata (`engine/elimination.ts`)
`bracketOrder(size)` gera a ordem clássica (8 → 1,8,4,5,2,7,3,6). Os classificados da fase anterior entram na ordem de seed.

## Probabilidades (`engine/simulate.ts`)
- Por mapa: `p = 1 / (1 + 10^((rB − rA)/400))`.
- Série MDx: binomial negativa (ex.: MD3 = p²(3−2p)).
- Modos: `weighted` (realista), `favorite` (sempre o mais forte), `coin` (50/50).

## Como adicionar um novo formato
1. `types.ts`: nova interface (ex.: `DoubleElimStageDef { type: 'double-elim' ... }`) e incluir no union `StageDef`.
2. `engine/<formato>.ts`: `computeX(def, entrants, results): StageState` — deve preencher `rounds`, `complete`, `qualified` (ordenados por seed para a próxima fase) e `placements`.
3. `tournament.ts`: novo ramo no `for`.
4. Componente de visualização + ramo em `App.tsx`.
5. Teste em `engine/engine.test.ts` (simular 30 vezes e checar invariantes).

Ideias de próximos formatos: dupla eliminação (BLAST R6 / Valorant), GSL (grupos de 4 com MD3), grupos round-robin, play-in.

## Persistência
- `localStorage['sdr:<tournamentId>:v1'] = { results, ratings }`.
- Compartilhar: mesmo JSON em base64 no hash `#s=...` (lido uma vez e removido da URL).
- Mudou a estrutura de `Saved`? Suba a versão (`v2`) em `state.ts`.
