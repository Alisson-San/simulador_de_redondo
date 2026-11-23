# Runbook

## Rodar localmente
```bash
npm install
npm run dev            # http://localhost:5173 (use --host para testar no celular na mesma rede)
```

## Validar
```bash
npm test               # testes do motor (vitest)
npm run build          # checagem de tipos + bundle em dist/
npm run preview        # serve o dist/ em http://localhost:4173
```

## Publicar (GitHub Pages)
- Workflow em `.github/workflows/pages.yml`: roda em push na `main` (ou manualmente em Actions).
- Uma vez: GitHub → Settings → Pages → Source = **GitHub Actions**.
- `vite.config.ts` usa `base: './'`, então funciona em qualquer subpasta.
- Alternativas: Vercel/Netlify apontando para `npm run build` e pasta `dist`.

## Problemas comuns
| Sintoma | Causa / solução |
|---|---|
| Simulação "presa" em resultados antigos | Dados no `localStorage`. Botão "Limpar fase" ou DevTools → Application → Local Storage → apagar `sdr:*` |
| Link compartilhado não carrega | Hash corrompido/truncado. O app ignora e cai no estado salvo |
| Probabilidades lentas | Use 500 simulações; roda em Web Worker, não trava a tela |
| Pareamento estranho no suíço | Conferir ordem de `invited` (é a ordem de seed) e regras em `docs/ARQUITETURA.md` |
| Mudou `id` de time e links quebraram | IDs de partida usam o id do time; mantenha estável |

## Atualizar dados do torneio real
- Seeds/times: `src/data/cs-major-singapore-2026.ts` (array `invited` de cada fase, em ordem de seed).
- Forças: campo `rating`. Usuário também pode ajustar na aba **Times** (salvo localmente).
- Resultados reais ainda não são importados automaticamente (ideia futura: arquivo `realResults` no data e botão "aplicar resultados reais").

## Economia de tokens para IA
- Comece por `CLAUDE.md` (mapa completo). Abra só o arquivo da tabela relevante.
- Motor (`src/engine`) é independente da UI: mudanças de regra não exigem ler componentes.
- Evite ler `package-lock.json`, `dist/`, `node_modules/`.
