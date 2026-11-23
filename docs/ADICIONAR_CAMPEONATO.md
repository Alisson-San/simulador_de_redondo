# Adicionar um campeonato

1. Copie `src/data/cs-major-singapore-2026.ts` para `src/data/<id>.ts`.
2. Edite `teams` com `T(id, nome, sigla, região, bandeira, rating, cor1, cor2)`.
   - `id`: minúsculo, sem espaço (usado nos IDs de partida — **não mude depois de publicado**, quebra links salvos).
   - `rating`: ~1500 (zebra) a ~1850 (elite).
   - `cor1/cor2`: cores do emblema gerado.
3. Defina `stages` em ordem. Exemplos:
```ts
{ id: 's1', type: 'swiss', name: 'Fase Suíça', short: 'SW', invited: [...16 ids em ordem de seed],
  winsToAdvance: 3, lossesToEliminate: 3, bestOf: { normal: 1, decisive: 3 }, firstRound: 'half' }

{ id: 'po', type: 'single-elim', name: 'Playoffs', short: 'PO', invited: [], from: { stageId: 's1' },
  size: 8, bestOf: [3, 3, 5], roundNames: ['Quartas', 'Semi', 'Final'] }
```
4. Registre em `src/data/index.ts`.
5. `npm test && npm run build`.

> Hoje a UI abre `tournaments[0]`. Com mais de um campeonato, adicionar seletor no `App.tsx` (topbar).
