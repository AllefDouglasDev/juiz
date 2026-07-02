# Roadmap — Juiz de Futebol ⚽️🟨🟥

App web mobile-first (PWA instalável) para juiz de futebol amador: gerenciar jogadores, sortear times balanceados e controlar uma partida (cartões, apitos e timer).

> **Regra de trabalho:** implementar **uma fase por vez**, na ordem. Cada fase é entregável de forma independente. Marcar os TODOs (`- [x]`) conforme forem concluídos.

---

## Decisões globais

- **Stack**: Next.js 16.2.10 (App Router, Turbopack default), React 19, Tailwind v4 (config via CSS, sem `tailwind.config.js`), pnpm.
- **Idiomas**: UI 100% em **português (pt-BR)**; código-fonte (arquivos, variáveis, comentários) 100% em **inglês**.
- **Rotas** (em inglês): `/` (partida — home), `/players` (jogadores), `/draw` (sorteio).
- **Dependências a adicionar (apenas 2)**: `@tanstack/react-query`, `next-themes`.
- **UI**: Tailwind + elementos nativos, sem biblioteca de componentes:
  - `<dialog>.showModal()` → popups e confirmações (focus trap, backdrop e ESC de graça);
  - `<select>` → dropdown de quantidade de times (no mobile abre o picker do sistema);
  - `<details>/<summary>` → lista colapsável.
- **Persistência**: localStorage com chaves namespaced — `juiz:players`, `juiz:draw:settings`, `juiz:draw:result`, `juiz:timer:duration`.
- **PWA**: obrigatório, com atenção especial a **iPhone** (maioria dos usuários). Detalhes na Fase 6.

### ⚠️ Gotchas do Next.js 16 (ler `node_modules/next/dist/docs/` antes de codar)

| Tema | O que mudou |
|---|---|
| Turbopack | É o default (`next dev`/`next build` sem flags) |
| Lint | `next lint` foi removido — usar `eslint` CLI direto |
| Middleware | Renomeado para `proxy.ts` (não usaremos) |
| `params`/`searchParams` | São `Promise` (só afeta rotas dinâmicas — não teremos) |
| `themeColor` | Vai no export `viewport`, **não** em `metadata` |
| Manifest PWA | Via `app/manifest.ts` (`MetadataRoute.Manifest`) |
| Providers de contexto | Devem ser `'use client'` envolvendo `{children}` no root layout |
| Dark mode manual | Tailwind v4: trocar `@media (prefers-color-scheme)` por `@custom-variant dark` + classe |

---

## Arquitetura

### Estrutura de pastas (alvo)

```
app/
  layout.tsx                  # html lang="pt-BR", suppressHydrationWarning, AppProviders, AppHeader
  page.tsx                    # Tela de partida (home)
  players/page.tsx            # Gerenciamento de jogadores
  draw/page.tsx               # Sorteio de times
  globals.css                 # Tailwind v4 @theme + @custom-variant dark
  manifest.ts                 # PWA (Fase 6)
  apple-icon.png              # apple-touch-icon 180×180 (Fase 6)
components/
  layout/    app-header.tsx, burger-menu.tsx, theme-toggle.tsx
  ui/        button.tsx, dialog.tsx, confirm-dialog.tsx, select.tsx, checkbox.tsx, collapsible.tsx
  players/   player-list.tsx, player-form.tsx, strength-picker.tsx
  draw/      draw-controls.tsx, team-card.tsx, in-game-players.tsx, add-players-dialog.tsx
  match/     match-timer.tsx, card-overlay.tsx, whistle-buttons.tsx
  pwa/       install-prompt.tsx, sw-register.tsx (Fase 6)
lib/
  types.ts                    # Player, NewPlayer, Team, DrawResult, DrawSettings
  storage/local-storage.ts    # helpers readJSON/writeJSON SSR-safe
  repositories/
    player-repository.ts      # interface (a abstração)
    local-storage-player-repository.ts
    index.ts                  # getPlayerRepository() — único ponto de troca futura p/ API
  draw/draw-teams.ts          # funções puras de sorteio/balanceamento
  audio/whistle-player.ts     # Web Audio (Fase 5)
hooks/
  use-players.ts              # TanStack Query: usePlayers + mutations
  use-local-storage-state.ts  # estado persistido genérico
  use-draw-settings.ts, use-draw-result.ts, use-countdown.ts
providers/app-providers.tsx   # 'use client': QueryClientProvider + ThemeProvider
public/sounds/                # whistle-short.mp3, whistle-double.mp3, whistle-long.mp3
public/sw.js                  # service worker mínimo (Fase 6)
```

### Camada de persistência (preparada para futuro banco de dados)

```ts
interface Player { id: string; name: string; strength: 1|2|3|4|5; inGame: boolean; }
type NewPlayer = Omit<Player, 'id'>;

interface PlayerRepository {
  list(): Promise<Player[]>;
  create(input: NewPlayer): Promise<Player>;
  update(id: string, patch: Partial<NewPlayer>): Promise<Player>;
  remove(id: string): Promise<void>;
}
```

- `LocalStoragePlayerRepository` implementa a interface (ids via `crypto.randomUUID()`, métodos async via `Promise.resolve`). Quando vier o banco compartilhado, cria-se `ApiPlayerRepository` e troca-se **apenas** a factory `getPlayerRepository()` em `lib/repositories/index.ts`.
- **TanStack Query por cima**: query key `['players']`, `staleTime: Infinity` (revisar quando vier a API); mutations (`useAddPlayer`, `useUpdatePlayer`, `useDeletePlayer`) invalidam `['players']` no `onSuccess`.
- **Configurações de dispositivo** (checkbox "usar força", settings do sorteio, último resultado, duração do timer) **não** passam pelo repository — são preferências locais. Usar hook genérico `useLocalStorageState<T>(key, defaultValue)` (default no primeiro render, carrega do localStorage em `useEffect` para evitar hydration mismatch, grava a cada mudança).
- **Resultado do sorteio** é salvo como *snapshot* (nomes e forças copiados) em `juiz:draw:result` — edições/exclusões futuras de jogadores não corrompem o último sorteio exibido.

### Algoritmo de sorteio (`lib/draw/draw-teams.ts`, funções puras)

1. Fisher–Yates shuffle nos jogadores com `inGame: true`.
2. `capacity = teamCount × playersPerTeam`; usa os primeiros `min(pool, capacity)` (subconjunto aleatório se sobrar gente).
3. Tamanhos-alvo: todos os times com `playersPerTeam`, exceto possivelmente o **último, que fica menor** com o resto.
4. **Modo aleatório**: distribui a seleção já embaralhada sequencialmente.
5. **Modo balanceado** ("usar força"): ordena a seleção embaralhada por força decrescente (o shuffle prévio randomiza os empates → resultado diferente a cada clique) e faz **snake draft** (1→k, k→1, alternando), pulando times cheios. Somas de força ficam próximas.

### Tema dark/light

- `next-themes` com `attribute="class"` (script anti-flash e persistência inclusos).
- `globals.css`: `@custom-variant dark (&:where(.dark, .dark *));` + tokens `.dark { --background; --foreground; ... }` no lugar do bloco `prefers-color-scheme`.
- `<html lang="pt-BR" suppressHydrationWarning>`; `themeColor` (light/dark) via export `viewport`.
- Toggle no header renderizado só após mount (flag em `useEffect`) para evitar hydration mismatch.

### Áudio dos apitos

- **Web Audio API** (não `HTMLAudioElement`): latência menor no mobile e permite `GainNode` (~2.0) + `DynamicsCompressorNode` para **volume máximo** sem clipping. Obs.: o teto real é o volume físico do aparelho.
- `whistle-player.ts` (singleton): `AudioContext` criado/resumido no **primeiro gesto do usuário** (política de autoplay do iOS), buffers das 3 variações pré-decodificados, `play(type)` cria um `BufferSource` novo por toque (permite toques rápidos repetidos).
- Timer zerando → toca o apito longo.

### Timer da partida

- Baseado em **timestamp** (`remaining = endAt - Date.now()`), imune a drift de `setInterval` e throttling de aba em background; interval de 250ms só dispara re-render.
- Estados: `idle | running | paused | finished`. Pause acumula o decorrido; display grande do tempo **restante** + display menor do tempo **decorrido**.
- `Reset` e `+1 min` sempre atrás de dialog de confirmação. Ao chegar em 0: estado `finished` + apito longo (uma vez).
- Duração configurável e persistida em `juiz:timer:duration`. Estado de execução não persiste (melhoria futura: salvar `endAt` para sobreviver a refresh).

---

## Fases

### Fase 1 — Fundação (deps, tema, shell, rotas)

Objetivo: app navegável com menu-burguer, tema dark/light e as 3 rotas.

- [x] `pnpm add @tanstack/react-query next-themes`
- [x] `providers/app-providers.tsx` (`'use client'`: `QueryClientProvider` + `ThemeProvider attribute="class"`)
- [x] Reescrever `app/layout.tsx`: `lang="pt-BR"`, `suppressHydrationWarning`, metadata "Juiz de Futebol", export `viewport` com `themeColor` (light/dark), `<AppProviders>` + `<AppHeader>`
- [x] `globals.css`: `@custom-variant dark` + tokens light/dark (substituir `prefers-color-scheme`)
- [x] `components/layout/app-header.tsx`: header sticky com burger + título + `ThemeToggle`
- [x] `components/layout/burger-menu.tsx`: slide-over com **Iniciar Partida** (`/`), **Jogadores** (`/players`), **Sortear Times** (`/draw`)
- [x] `components/layout/theme-toggle.tsx` (sol/lua, hidratação via `useSyncExternalStore` — o lint novo do React proíbe `setState` em effect)
- [x] Stubs de `app/players/page.tsx` e `app/draw/page.tsx`; home placeholder em `app/page.tsx`
- [x] `components/ui/button.tsx` básico (touch target ≥ 44px)
- [x] Verificar: navegação, toggle de tema persistindo, sem flash, sem erro de hydration

**Blockers:** nenhum. ✅ **Fase concluída.**

> Nota de implementação: o overlay do menu é renderizado via `createPortal(document.body)` — o `backdrop-blur` do header cria um containing block que prenderia o `position: fixed` dentro do header.

---

### Fase 2 — Gerenciamento de jogadores (`/players`)

Objetivo: CRUD completo de jogadores persistido em localStorage atrás da abstração.

- [x] `lib/types.ts` (`Player`, `NewPlayer`)
- [x] `lib/storage/local-storage.ts` (helpers SSR-safe: `typeof window` guard, try/catch no parse)
- [x] `lib/repositories/player-repository.ts` (interface) + `local-storage-player-repository.ts` + factory `index.ts`
- [x] `hooks/use-players.ts`: `usePlayers` + `useAddPlayer`/`useUpdatePlayer`/`useDeletePlayer` (invalidação de `['players']`)
- [x] `components/ui/confirm-dialog.tsx` e `components/ui/dialog.tsx` (native `<dialog>`)
- [x] `components/players/strength-picker.tsx`: força 1–5 tocável (default **3**)
- [x] `components/players/player-form.tsx`: nome + força + toggle "No jogo" (id gerado automaticamente, **não aparece** na UI)
- [x] `components/players/player-list.tsx`: lista com editar/excluir (excluir com confirmação) + toggle rápido "no jogo"
- [x] `app/players/page.tsx` com empty state ("Nenhum jogador cadastrado") — composição client em `components/players/players-screen.tsx`
- [x] Verificar: criar/editar/excluir/toggle sobrevivem a refresh; textos em pt-BR

**Blockers:** nenhum. ✅ **Fase concluída.**

> Notas de implementação: `<dialog>` nativo precisa de `m-auto` (o preflight do Tailwind zera as margens e quebra a centralização nativa); lista ordenada alfabeticamente com `localeCompare("pt-BR")`; formulário de edição remontado via `key={player.id}`.

---

### Fase 3 — Sorteio de times (`/draw`)

Objetivo: sorteio configurável, balanceado por força (opcional) e persistido.

- [x] `hooks/use-local-storage-state.ts` (genérico, via `useSyncExternalStore` — hydration-safe e sincroniza entre abas)
- [x] `hooks/use-draw-settings.ts` (`juiz:draw:settings`: teamCount, playersPerTeam, useStrength) + `hooks/use-draw-result.ts` (`juiz:draw:result`)
- [x] `lib/draw/draw-teams.ts`: `drawTeams(players, settings)` puro — modos aleatório e balanceado (snake draft), último time menor, times vazios descartados
- [x] Teste rápido do algoritmo (7 asserções via `node --experimental-strip-types`: divisibilidade 4/4/2, sem duplicatas, balanceamento com spread ≤ 1 em 500 rodadas, aleatoriedade entre cliques)
- [x] `components/ui/select.tsx`, `components/ui/checkbox.tsx`, `components/ui/collapsible.tsx`
- [x] `components/draw/draw-controls.tsx`: `<select>` de times (2–8), **dropdown** "Jogadores por time" de 1–7 (default **4**, mudado de input para dropdown a pedido do usuário), checkbox "Usar força dos jogadores" (persistido), botão **"Sortear times"** (re-sorteia a cada clique) + aviso de quantos ficam de fora
- [x] `components/draw/team-card.tsx`: "Time 1..N" com jogadores (+ soma de força quando balanceado)
- [x] `components/draw/in-game-players.tsx`: lista **colapsável** dos que estão no jogo (+ botão ✕ para remover do jogo)
- [x] `components/draw/add-players-dialog.tsx`: popup listando quem está **fora** do jogo → adicionar (muta `inGame`)
- [x] Persistir resultado: último sorteio sempre restaurado ao voltar/atualizar a página
- [x] Verificar: 10 jogadores ÷ 3 times de 4 → times 4/4/2; modo força gera somas próximas; tudo em pt-BR

**Blockers:** nenhum. ✅ **Fase concluída.**

---

### Fase 4 — Tela de partida (`/`, home)

Objetivo: cartões, timer completo e botões de apito (som ainda stub).

- [x] `components/match/card-overlay.tsx`: botões 🟨/🟥 → overlay **em tela cheia** na cor do cartão (portal para `document.body`, `z-[60]`); toque em qualquer lugar dispensa
- [x] `hooks/use-countdown.ts` (timestamp-based; "now" atualizado só em ticks/ações — o lint novo do React proíbe `Date.now()` durante render; catch-up em `visibilitychange`)
- [x] `components/match/match-timer.tsx`: display grande do restante (mm:ss) + menor do decorrido; play/pause; **Reset** com confirmação; **+1 min** com confirmação; duração configurável persistida (`juiz:timer:duration`, default 10 min, dropdown 1–60, editável só com timer parado)
- [x] Ao zerar: estado "finalizado" ("Fim do tempo!") + apito longo (stub até a Fase 5); **+1 min após o fim retoma o jogo**
- [x] `components/match/whistle-buttons.tsx`: 3 botões grandes — **Curto**, **Duplo**, **Longo** — chamando `lib/audio/whistle-player.ts` (stub com `console.debug`)
- [x] Montar `app/page.tsx` (layout vertical mobile: timer no topo, apitos no meio, cartões embaixo — composição em `components/match/match-screen.tsx`)
- [x] Verificar: timer preciso com aba em background; confirmações funcionam; overlay cobre a tela toda

**Blockers:** nenhum. ✅ **Fase concluída** (áudio real na Fase 5).

---

### Fase 5 — Áudio dos apitos

Objetivo: 3 apitos reais, o mais alto possível, + apito automático no fim do tempo.

- [ ] 🔓 Resolver blocker: baixar 3 sons de apito (curto, duplo/duas notas, longo) de fonte **CC0/livre** — pixabay.com/sound-effects ou freesound.org — e **verificar a licença**
- [ ] Colocar em `public/sounds/` (`whistle-short.mp3`, `whistle-double.mp3`, `whistle-long.mp3`)
- [ ] `lib/audio/whistle-player.ts`: AudioContext desbloqueado no primeiro gesto, pré-decodificação, `GainNode` (~2.0) + `DynamicsCompressorNode`, um `BufferSource` por toque
- [ ] Ligar os 3 botões + apito longo ao timer zerar
- [ ] Testar em celular real (iPhone principalmente): latência, volume, **comportamento com a chave de silêncio ativada**

**Blockers:**
- 🚫 **Arquivos de áudio precisam ser baixados da web** (licença CC0 verificada). *Fallback para não travar: apito sintetizado via osciladores Web Audio.*
- ⚠️ O volume máximo real é limitado pelo volume físico do aparelho (não há como ultrapassar via código).

---

### Fase 6 — PWA + polimento (obrigatório, foco em iPhone)

Objetivo: app instalável na tela de início, com shell offline e experiência nativa no iOS.

- [ ] `app/manifest.ts` (`MetadataRoute.Manifest`): nome/descrição em pt-BR, `display: 'standalone'`, `start_url: '/'`, ícones 192/512, cores de tema/fundo
- [ ] 🔓 Resolver blocker: gerar ícones do app — 192×192, 512×512 (`public/`) + `app/apple-icon.png` 180×180 (Next gera a tag `apple-touch-icon` automaticamente)
- [ ] Metadata Apple no layout: `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Juiz de Futebol' }`
- [ ] `viewport`: `viewportFit: 'cover'` + CSS `env(safe-area-inset-*)` no header sticky e no `card-overlay` (notch/Dynamic Island)
- [ ] `components/pwa/install-prompt.tsx`: detecta iOS (userAgent) e `display-mode: standalone` (matchMedia); se não instalado, banner em pt-BR: "Toque em Compartilhar → Adicionar à Tela de Início" (iOS **não** tem `beforeinstallprompt`)
- [ ] `public/sw.js`: service worker **mínimo escrito à mão** (cache do shell, network-first com fallback) — **não usar Serwist** (exige webpack; Next 16 usa Turbopack) + `components/pwa/sw-register.tsx`
- [ ] Screen Wake Lock (`navigator.wakeLock.request('screen')`) enquanto o timer roda — tela não apaga durante a partida (iOS ≥ 16.4)
- [ ] Passada final: touch targets ≥ 44px, revisão dos textos em pt-BR
- [ ] Teste real em iPhone instalado na tela de início: abrir offline, áudio no modo standalone, chave de silêncio, localStorage persistindo, safe areas

**Blockers:**
- 🚫 **Ícones do app** (192/512 + apple-touch 180) precisam ser criados/gerados (ex.: realfavicongenerator.net).
- ⚠️ Instalação exige **HTTPS** — produção via Vercel resolve; teste local com `next dev --experimental-https`.
- ⚠️ Validação final depende de um **iPhone físico** (simuladores não reproduzem áudio/silêncio/wake lock fielmente).

---

## Melhorias futuras (fora de escopo por enquanto)

- Banco de dados compartilhado → `ApiPlayerRepository` (trocar só a factory)
- Persistir estado do timer em execução (sobreviver a refresh)
- Histórico de partidas / placar
- Compartilhar resultado do sorteio (Web Share API)
