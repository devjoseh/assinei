# Assinei — Novas Funcionalidades

> Documento de referência para a segunda fase de desenvolvimento do Assinei, a ser iniciada após a conclusão de todas as features do `assinei-prompt.md`. Implementar uma feature de cada vez, na ordem indicada, respeitando as dependências.

---

## Como usar este documento

- `[ ]` → Não implementado
- `[x]` → Implementado e funcionando
- `[~]` → Implementado parcialmente ou com limitações conhecidas
- `[!]` → Bloqueado por dependência não concluída ou problema técnico

**Regra geral:** Cada feature que adiciona collection ou campo novo no MongoDB deve ser documentada com o schema exato da mudança antes de escrever qualquer código. Credenciais de terceiros (Unosend) ficam exclusivamente em variáveis de ambiente no servidor — nunca no cliente.

---

## Log de Sessões

```
[SESSÃO 1] Data: ____-__-__
- O que foi implementado:
- Arquivos criados/modificados:
- Decisões técnicas tomadas:
- Problemas encontrados:
- Próximo passo recomendado:
```

*(duplicar a cada nova sessão)*

---

## Estado do Projeto ao Iniciar Esta Fase

```
Todas as features do assinei-prompt.md: concluídas
Stack: Next.js 15 (App Router), TypeScript, MongoDB (driver nativo), NextAuth.js v5,
       Tailwind CSS, shadcn/ui, date-fns (pt-BR), sonner, next-themes
Autenticação: usuário único (admin), JWT via NextAuth, HTTP-only cookies
Collections existentes: users, subscriptions, image_history
Todas as operações de banco passam exclusivamente pelas API routes — nenhuma credencial no cliente
```

---

---

# FASE A — Histórico de Pagamentos

> Permite que o usuário registre manualmente quando realizou um pagamento, criando um log real de gastos por assinatura ao longo do tempo.

---

### [ ] A.1 — Schema e API Routes de Pagamentos

**Descrição:**
Criar a collection `payments` no MongoDB e as rotas necessárias para registrar, listar e deletar pagamentos de cada assinatura.

**Nova collection — `payments`:**
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  subscriptionId: ObjectId,
  subscriptionName: string,   // snapshot do nome no momento do pagamento
  amount: number,             // valor em centavos (snapshot do preço no momento)
  billingCycle: string,       // snapshot do ciclo no momento
  paidAt: Date,               // data que o usuário informou no modal
  notes?: string,             // campo livre opcional
  createdAt: Date             // data de criação do registro
}
```

**Rotas a criar (todas em `/app/api/payments/`):**
```
GET    /api/payments                        → Lista todos os pagamentos do usuário
                                              Query params: ?subscriptionId= ?month= ?year=
POST   /api/payments                        → Registra novo pagamento
DELETE /api/payments/[id]                   → Remove um registro de pagamento
GET    /api/payments/summary                → Retorna total pago por mês (para o gráfico de A.4)
```

**Payload do POST `/api/payments`:**
```ts
{
  subscriptionId: string,   // ObjectId da assinatura
  paidAt: string,           // ISO date string (data informada pelo usuário)
  notes?: string
}
```

O servidor deve resolver `subscriptionName`, `amount` e `billingCycle` a partir do `subscriptionId` — o cliente não envia esses campos. Validação com Zod em todas as rotas. Verificar sessão com `auth()` em toda rota antes de qualquer operação.

**Dependências:** nenhuma

---

### [ ] A.2 — Botão e Modal "Pagamento Efetuado"

**Descrição:**
Adicionar na interface o fluxo completo para o usuário registrar um pagamento: botão no card da assinatura que abre um modal com seleção de data.

**Comportamento do botão:**
- Adicionar botão "Pagamento efetuado" (ícone de check ou cifrão) no `subscription-card.tsx`
- Visível junto aos botões de editar e deletar
- Não deve aparecer em assinaturas com `isActive: false`

**Modal de registro de pagamento:**
- Título: "Registrar Pagamento"
- Exibe o nome e valor da assinatura no topo do modal (somente leitura)
- Campo de data: `DatePicker` (shadcn/ui Popover + Calendar) com o valor padrão sendo a **data atual**
- O usuário pode alterar a data para qualquer dia passado ou presente (não permitir datas futuras)
- Campo "Observações" opcional (textarea, max 200 chars)
- Botão "Confirmar pagamento" → chama `POST /api/payments` → fecha modal → toast "Pagamento registrado!"
- Botão "Cancelar" → fecha modal sem salvar
- Estado de loading no botão de confirmar enquanto a requisição está em andamento

**Componente a criar:** `components/payment-register-modal.tsx`

**Dependências:** A.1

---

### [ ] A.3 — Histórico de Pagamentos por Assinatura

**Descrição:**
Página ou drawer que exibe o histórico completo de pagamentos de uma assinatura específica.

**Como acessar:**
- Adicionar link/botão "Ver histórico" no card da assinatura (ícone de relógio ou lista)
- Abre um `Sheet` (drawer lateral) com o histórico daquela assinatura

**Conteúdo do drawer:**
- Título: "Histórico — [Nome da Assinatura]"
- Lista de pagamentos ordenada por `paidAt` decrescente
- Cada item exibe:
  - Data do pagamento formatada em `pt-BR` (ex: "15 de maio de 2025")
  - Valor pago formatado como `R$ XX,XX`
  - Observações (se houver), em texto menor e cor secundária
  - Botão de deletar registro (ícone de lixeira) com `AlertDialog` de confirmação
- Total pago exibido no rodapé do drawer: "Total registrado: R$ X.XXX,XX"
- Empty state quando não há pagamentos registrados
- Skeleton enquanto carrega

**Componente a criar:** `components/payment-history-drawer.tsx`

**Dependências:** A.1, A.2

---

# FASE B — Comparação Mês a Mês

> Gráfico de linha que mostra a evolução dos gastos mensais ao longo dos últimos meses, com base nos pagamentos registrados.

---

### [ ] B.1 — Componente de Gráfico Mensal

**Descrição:**
Adicionar na dashboard um gráfico de linha mostrando quanto foi gasto (em pagamentos registrados) mês a mês nos últimos 6 meses.

**Instalação necessária:**
```bash
npm install recharts
```

**Fonte dos dados:**
Rota `GET /api/payments/summary` (criada em A.1), que deve retornar:
```ts
{
  months: Array<{
    label: string,      // ex: "Jan", "Fev", "Mar" — locale pt-BR abreviado
    year: number,
    month: number,
    total: number       // soma de amount em centavos
  }>
}
```
A rota retorna sempre os últimos 6 meses com dados, preenchendo com `total: 0` os meses sem pagamentos.

**Componente a criar:** `components/monthly-chart.tsx`

**Especificações do gráfico:**
- `LineChart` do Recharts com `ResponsiveContainer` (100% de largura, 220px de altura)
- Linha com cor do accent (`#E8770A`) e dots visíveis
- Eixo X: labels dos meses (`label`)
- Eixo Y: formatado como `R$ X.XXX` (sem casas decimais no eixo)
- Tooltip customizado: fundo do card atual (dark/light), exibe mês completo + valor formatado como `R$ XX,XX`
- `CartesianGrid` com `strokeDasharray="3 3"` e opacidade baixa
- Sem legenda (é uma linha só)
- Skeleton de 220px de altura enquanto carrega
- Se todos os valores forem zero: exibe empty state no lugar do gráfico com texto "Nenhum pagamento registrado ainda."

**Posicionamento na dashboard:**
- Abaixo da stats bar e acima do grid de assinaturas
- Título da seção: "Evolução de Gastos" com subtítulo "Últimos 6 meses · baseado em pagamentos registrados"
- Colapsável (o usuário pode minimizar a seção — salvar preferência no `localStorage`)

**Dependências:** A.1

---

# FASE C — Tags Personalizadas

> Sistema de tags livres por assinatura para organização além das categorias fixas.

---

### [ ] C.1 — Schema e API para Tags

**Descrição:**
Adicionar suporte a tags personalizadas nas assinaturas, com uma collection auxiliar para sugestão de tags já usadas anteriormente.

**Alteração no schema de `subscriptions`:**
```ts
tags?: string[]   // array de strings, cada tag max 30 chars, max 10 tags por assinatura
```

**Nova collection — `tags_history`:**
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  tag: string,         // nome da tag em lowercase, trimmed
  usageCount: number,
  lastUsedAt: Date,
  createdAt: Date
}
```

**Rotas a criar:**
```
GET    /api/tags                → Lista tags já usadas pelo usuário (ordenadas por usageCount desc)
DELETE /api/tags/[tag]          → Remove tag do histórico (não remove das assinaturas)
```

A lógica de upsert no `tags_history` deve ocorrer dentro da rota `POST /api/subscriptions` e `PATCH /api/subscriptions/[id]` — sempre que uma nova tag for salva em uma assinatura, atualizar ou criar o registro correspondente.

**Dependências:** nenhuma

---

### [ ] C.2 — Campo de Tags no Formulário de Assinatura

**Descrição:**
Adicionar o campo de tags no `subscription-form.tsx`, com input de multi-tag e sugestões baseadas nas tags já usadas.

**Comportamento do campo:**
- Label: "Tags" (opcional)
- Input com chips: o usuário digita uma tag e pressiona `Enter` ou `,` para confirmar
- Cada tag aparece como um chip com botão `×` para remover
- Ao focar no campo: exibir dropdown com sugestões das tags já usadas (buscar `GET /api/tags`)
- Sugestões filtradas dinamicamente conforme o usuário digita
- Tags novas são aceitas sem precisar existir no histórico
- Limite de 10 tags por assinatura — ao atingir o limite, desabilitar o input com tooltip explicativo
- Limite de 30 caracteres por tag — exceder trunca silenciosamente
- Tags salvas sempre em lowercase e com trim

**Componente a criar:** `components/tag-input.tsx` (reutilizável)

**Dependências:** C.1

---

### [ ] C.3 — Exibição de Tags e Filtro por Tag

**Descrição:**
Exibir as tags nos cards de assinatura e permitir filtrar a dashboard por tag.

**No `subscription-card.tsx`:**
- Exibir as tags como chips pequenos abaixo do nome da assinatura
- Se houver mais de 3 tags: exibir as 3 primeiras + badge "+N" com tooltip listando todas
- Chips com cor neutra (borda suave), distintos visualmente das category badges (que têm cor sólida)

**Filtro por tag na dashboard:**
- Adicionar seção "Tags" nos filtros, abaixo dos category filter pills
- Exibir todas as tags que o usuário possui em ao menos uma assinatura ativa
- Multi-select: clicar em uma tag filtra as assinaturas que a possuem
- Combina com o filtro de categoria (AND, não OR): se categoria + tag selecionadas, exibe apenas assinaturas que satisfazem ambos
- Chips de tag selecionados aparecem como ativos (cor accent)

**Página `/configuracoes`:**
- Adicionar seção "Gerenciar Tags" com a lista de todas as tags do histórico
- Exibe: nome da tag, quantas assinaturas ativas a utilizam, botão de deletar do histórico

**Dependências:** C.1, C.2

---

# FASE D — Exportar CSV

> Permite ao usuário baixar um arquivo CSV com todas as suas assinaturas e dados financeiros.

---

### [ ] D.1 — Rota de Exportação e Botão de Download

**Descrição:**
Criar uma rota de exportação que gera e retorna um CSV com os dados das assinaturas, e adicionar o botão de download na interface.

**Rota a criar:**
```
GET /api/export/csv
```

**Comportamento da rota:**
- Verificar sessão com `auth()` antes de qualquer operação
- Buscar todas as assinaturas do usuário (ativas e inativas)
- Gerar CSV com as seguintes colunas (cabeçalhos em português):

| Nome | Descrição | Preço (R$) | Ciclo | Próximo Pagamento | Categoria | Tags | Status | Valor Mensal (R$) | Valor Anual (R$) | Criado em |
|---|---|---|---|---|---|---|---|---|---|---|

- Valores monetários formatados com vírgula decimal (padrão brasileiro): `29,90`
- Datas no formato `dd/mm/yyyy`
- Tags como string separada por ponto-e-vírgula: `streaming;entretenimento`
- Status: `Ativa` ou `Pausada`
- Separador: `;` (ponto-e-vírgula, padrão para Excel brasileiro)
- Encoding: `UTF-8 com BOM` (`\uFEFF` no início) para garantir acentos no Excel
- Response headers:
  ```
  Content-Type: text/csv; charset=utf-8
  Content-Disposition: attachment; filename="assinei-export-YYYY-MM-DD.csv"
  ```

**Botão na interface:**
- Localização: header da dashboard, ao lado do toggle de visualização (grid/lista)
- Ícone `Download` do lucide-react + texto "Exportar CSV"
- Ao clicar: chama `GET /api/export/csv` via `window.location.href` ou `fetch` + `blob` + link programático
- Estado de loading enquanto o arquivo é gerado
- Toast de sucesso após download iniciado

**Dependências:** nenhuma (mas idealmente implementado após as Fases A, B e C para que o CSV inclua tags)

---

# FASE E — Alertas de Vencimento por Email

> Envia um email automático ao admin X dias antes de cada vencimento de assinatura, usando a API do Unosend.

---

### [ ] E.1 — Integração com Unosend e Serviço de Email

**Descrição:**
Criar o serviço de envio de email usando a API do Unosend e configurar o template de alerta de vencimento.

**Variável de ambiente a adicionar no `.env.local`:**
```env
UNOSEND_API_KEY=un_XBgx8LxGA-vQLzFWj7MI58yw68yc_OJn
ALERT_EMAIL_FROM=noreply@assinei.app   # ou o domínio verificado no Unosend
ALERT_EMAIL_TO=                         # email do admin (pode ser o mesmo do ADMIN_EMAIL)
ALERT_DAYS_BEFORE=3                     # quantos dias antes enviar o alerta (padrão: 3)
```

**Serviço a criar: `lib/email.ts` (server-only)**
```ts
// Deve exportar:
sendPaymentAlertEmail(subscriptions: AlertSubscription[]): Promise<void>

type AlertSubscription = {
  name: string,
  price: number,          // em centavos
  billingCycle: string,
  nextPaymentDate: Date,
  daysUntil: number,
  imageUrl?: string
}
```

**Integração com Unosend:**
- Usar `fetch` nativo para chamar a API REST do Unosend
- Endpoint: `POST https://api.unosend.com/v1/emails` (verificar documentação atual do Unosend)
- Auth: header `Authorization: Bearer ${process.env.UNOSEND_API_KEY}`
- Corpo do email: HTML responsivo gerado via template string no próprio serviço
- Nunca expor a API key no cliente — este arquivo deve ter `'server-only'` como primeira linha

**Template do email:**
- Assunto: `"Assinei — {N} vencimento(s) nos próximos {DAYS} dias"`
- Saudação: "Bom dia," seguido de linha em branco
- Para cada assinatura na lista:
  - Nome em negrito
  - Valor formatado como `R$ XX,XX` + ciclo por extenso
  - Data de vencimento formatada (ex: "15 de junho de 2025")
  - Urgência: "Vence amanhã" / "Vence em X dias"
- Rodapé: "Enviado pelo Assinei · Suas assinaturas, sob controle."
- Design simples, sem imagens embutidas, compatível com clientes de email

**Dependências:** nenhuma

---

### [ ] E.2 — Cron Job de Alertas (Vercel Cron)

**Descrição:**
Criar a rota de cron que é chamada automaticamente pelo Vercel todo dia pela manhã para verificar vencimentos e disparar emails.

**Rota a criar:** `app/api/cron/payment-alerts/route.ts`

**Configuração do Vercel Cron em `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/payment-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```
*(executa todo dia às 09:00 UTC — ajustar conforme necessário para horário de Brasília: 06:00 BRT = 09:00 UTC)*

**Lógica da rota:**
1. Verificar header `Authorization: Bearer ${process.env.CRON_SECRET}` — rejeitar com 401 se inválido
2. Buscar todas as assinaturas ativas de todos os usuários (é single-user, mas manter genérico)
3. Para cada assinatura, calcular `daysUntil = differenceInDays(nextPaymentDate, today)`
4. Filtrar assinaturas onde `daysUntil <= parseInt(process.env.ALERT_DAYS_BEFORE ?? '3')` e `daysUntil >= 0`
5. Se houver assinaturas no resultado: chamar `sendPaymentAlertEmail(subscriptions)`
6. Se lista vazia: não enviar email, retornar `{ sent: false, reason: "no upcoming payments" }`
7. Logar resultado (quantos alertas foram enviados) — sem dados sensíveis no log
8. Retornar `{ sent: true, count: N }` com status 200

**Variável de ambiente adicional:**
```env
CRON_SECRET=seu-secret-gerado-aqui   # openssl rand -hex 32
```

**Atualizar `.env.local.example`** com as novas variáveis desta fase.

**Teste manual:**
- Criar rota `GET /api/cron/payment-alerts/test` (somente em `NODE_ENV !== 'production'`) que executa a mesma lógica sem verificar o cron secret — útil para testar o envio de email em desenvolvimento

**Dependências:** E.1

---

### [ ] E.3 — Configurações de Alerta na Página `/configuracoes`

**Descrição:**
Adicionar seção na página de configurações para o usuário controlar as preferências de alerta por email.

**Collection a alterar — adicionar campo em `users`:**
```ts
emailAlerts: {
  enabled: boolean,         // padrão: true
  daysBefore: number,       // padrão: 3 (respeita ALERT_DAYS_BEFORE como fallback)
  emailTo: string           // padrão: email do admin (ADMIN_EMAIL)
}
```

**Rota a criar:**
```
PATCH /api/settings/alerts   → Atualiza preferências de alerta
GET   /api/settings/alerts   → Retorna preferências atuais
```

**Interface na página `/configuracoes`:**
- Seção "Alertas por Email"
- Toggle "Receber alertas de vencimento" (liga/desliga `enabled`)
- Campo numérico "Avisar X dias antes" (1 a 14, padrão 3)
- Campo de email "Enviar para" (pré-preenchido com o email do admin, editável)
- Botão "Salvar preferências" → `PATCH /api/settings/alerts` → toast de confirmação
- Botão "Enviar email de teste agora" → chama `GET /api/cron/payment-alerts/test` → toast com resultado

**Ajuste no cron (E.2):**
- Ao invés de usar `process.env.ALERT_DAYS_BEFORE`, buscar as preferências do usuário no banco antes de filtrar as assinaturas
- Se `emailAlerts.enabled === false`, encerrar a rota sem enviar email

**Dependências:** E.1, E.2

---

---

## Resumo de Progresso

| Fase | Descrição | Tasks | Concluídas |
|------|-----------|-------|------------|
| A | Histórico de Pagamentos | 3 | 0 |
| B | Comparação Mês a Mês | 1 | 0 |
| C | Tags Personalizadas | 3 | 0 |
| D | Exportar CSV | 1 | 0 |
| E | Alertas de Vencimento por Email | 3 | 0 |
| **Total** | | **11** | **0** |

---

## Ordem de Implementação Recomendada

```
A.1 → A.2 → A.3 → B.1 → C.1 → C.2 → C.3 → D.1 → E.1 → E.2 → E.3
```

Seguir essa ordem garante que cada feature tem suas dependências satisfeitas e que o banco de dados evolui de forma incremental e segura.

---

*Assinei — Novas Funcionalidades. Atualizar Log de Sessões e checkboxes ao final de cada sessão de desenvolvimento.*
