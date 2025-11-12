# 🏗️ Sistema Completo de Cards de Obra

## 📋 Visão Geral

O sistema de **Cards de Obra** funciona como um **centro de custo** para projetos, permitindo:

- **Criação de projetos** com orçamento definido
- **Transferência de verbas** do caixa principal para o card
- **Registro de despesas** com comprovantes
- **Solicitação de verba adicional** pelo responsável
- **Workflow de aprovação** pelo administrador
- **Finalização e análise** com cálculo de rentabilidade

---

## 👥 Fluxo por Perfil

### 🔵 **ADMIN (Proprietário)**

#### 1️⃣ Criar Novo Card de Obra
- **Ação:** Clicar em "Novo Card"
- **Dados:**
  - Título da obra (ex: "Fachada ENF CLINIC")
  - Nome do cliente
  - Valor da venda/orçamento
  - Responsável (visualizador)
- **Resultado:** Card criado com status `PENDENTE`

#### 2️⃣ Transferir Verba para o Card
- **Ação:** Abrir card → "Transferir Verba"
- **Dados:** Valor a transferir
- **Resultado:**
  - `saldo_atual` do card aumenta
  - Status muda para `EM_ANDAMENTO`

#### 3️⃣ Aprovar Solicitações de Verba
- **Quando:** Visualizador solicita verba adicional
- **Ação:** Ver solicitação → Aprovar ou Reprovar
- **Se aprovar:**
  - Transfere o valor solicitado
  - `saldo_atual` aumenta
  - Status volta para `EM_ANDAMENTO`
- **Se reprovar:**
  - Adiciona notas de justificativa
  - Status permanece `AGUARDANDO_VERBA`

#### 4️⃣ Analisar e Fechar Obras Finalizadas
- **Quando:** Visualizador finaliza a obra
- **Fila:** Cards com status `EM_ANALISE`
- **Ação:** Revisar todas as despesas e comprovantes
- **Pode:**
  - Aprovar despesas individuais
  - Reprovar despesas (retorna para visualizador corrigir)
- **Fechamento:**
  - `saldo_atual` retorna automaticamente ao Caixa Principal
  - Calcula **rentabilidade**: `valor_venda_orcamento - total_gasto`
  - Status muda para `FINALIZADO`
  - Gera relatório de lucratividade

---

### 🟢 **VISUALIZADOR (Responsável pela Obra)**

#### 1️⃣ Ver Cards Atribuídos
- Visualiza apenas cards onde é `id_visualizador_responsavel`
- Pode filtrar por status e buscar

#### 2️⃣ Registrar Despesas
- **Quando:** Status `EM_ANDAMENTO`
- **Ação:** Abrir card → "Registrar Despesa"
- **Dados:**
  - Descrição (ex: "Placas ACM Bege")
  - Valor
  - Categoria (dropdown)
  - **Comprovante** (imagem/PDF)
- **Validações:**
  - Verifica se há saldo suficiente
  - Desconta do `saldo_atual`
  - Soma no `total_gasto`
- **Resultado:** Despesa com status `PENDENTE`

#### 3️⃣ Solicitar Verba Adicional
- **Quando:** Saldo insuficiente ou necessidade extra
- **Ação:** "Solicitar Verba"
- **Dados:**
  - Valor solicitado
  - Justificativa detalhada
- **Resultado:**
  - Card muda para status `AGUARDANDO_VERBA`
  - Notificação para admin
  - **Trava novas despesas** até aprovação

#### 4️⃣ Finalizar Obra
- **Quando:** Todas as despesas registradas
- **Ação:** "Finalizar e Enviar para Análise"
- **Confirmação:** Modal de aviso
- **Resultado:**
  - Status muda para `EM_ANALISE`
  - **Card travado** (não pode mais registrar despesas)
  - Aguarda análise do admin

---

## 📊 Status do Card

| Status | Cor | Descrição | Ações Disponíveis |
|--------|-----|-----------|-------------------|
| **PENDENTE** | 🟡 Amarelo | Card criado, aguarda primeira transferência | Admin: Transferir verba |
| **EM_ANDAMENTO** | 🔵 Azul | Obra em execução | Visualizador: Registrar despesas, Solicitar verba, Finalizar |
| **AGUARDANDO_VERBA** | 🟣 Roxo | Aguardando aprovação de verba | Admin: Aprovar/Reprovar solicitação |
| **EM_ANALISE** | 🔷 Ciano | Obra finalizada, em revisão | Admin: Revisar despesas, Fechar obra |
| **FINALIZADO** | 🟢 Verde | Obra concluída e aprovada | Visualizar relatório |
| **CANCELADO** | 🔴 Vermelho | Obra cancelada | Somente leitura |

---

## 🔄 Fluxo Completo (Exemplo Real)

### 📝 Exemplo: Fachada ENF CLINIC

#### **Etapa 1: Criação**
- Admin cria card:
  - Título: "Fachada ENF CLINIC"
  - Cliente: "Clinica ENF"
  - Orçamento: R$ 50.000,00
  - Status: `PENDENTE`

#### **Etapa 2: Início da Obra**
- Admin transfere R$ 15.000,00
  - `saldo_atual`: R$ 15.000,00
  - Status: `EM_ANDAMENTO`

#### **Etapa 3: Execução**
- Visualizador registra despesas:
  1. "Placas ACM Bege" - R$ 8.000,00 (Categoria: Material)
  2. "Mão de Obra Instalação" - R$ 4.500,00 (Categoria: Serviços)
  3. Saldo restante: R$ 2.500,00

#### **Etapa 4: Solicitação de Verba**
- Visualizador solicita R$ 10.000,00
- Justificativa: "Necessário para acabamento final e pintura"
- Status: `AGUARDANDO_VERBA`

#### **Etapa 5: Aprovação**
- Admin aprova solicitação
- Transfere R$ 10.000,00
- Novo saldo: R$ 12.500,00
- Status: `EM_ANDAMENTO`

#### **Etapa 6: Continuação**
- Visualizador registra:
  1. "Tinta Premium" - R$ 3.200,00
  2. "Acabamento Final" - R$ 7.800,00
  3. Saldo restante: R$ 1.500,00

#### **Etapa 7: Finalização**
- Visualizador clica "Finalizar e Enviar para Análise"
- Status: `EM_ANALISE`
- Total gasto: R$ 23.500,00

#### **Etapa 8: Análise Admin**
- Admin revisa todas as despesas e comprovantes
- Todas aprovadas ✅
- Clica "Aprovar e Fechar Obra"

#### **Etapa 9: Fechamento Automático**
- Saldo R$ 1.500,00 retorna ao Caixa Principal
- Cálculo de rentabilidade:
  - **Orçamento**: R$ 50.000,00
  - **Gasto Total**: R$ 23.500,00
  - **Lucro**: R$ 26.500,00
  - **Margem**: 53%
- Status: `FINALIZADO`

---

## 💾 Estrutura de Dados

### Tabela `cards_de_obra`

```sql
CREATE TABLE cards_de_obra (
  id_card UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  nome_cliente VARCHAR(255) NOT NULL,
  status status_projeto DEFAULT 'PENDENTE',
  valor_venda_orcamento DECIMAL(15, 2) NOT NULL,
  saldo_atual DECIMAL(15, 2) DEFAULT 0,
  total_gasto DECIMAL(15, 2) DEFAULT 0,
  id_visualizador_responsavel UUID REFERENCES auth.users(id),
  rentabilidade DECIMAL(15, 2),
  finalizado_em TIMESTAMPTZ,
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela `despesas_de_obra`

```sql
CREATE TABLE despesas_de_obra (
  id_despesa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card UUID REFERENCES cards_de_obra(id_card) ON DELETE CASCADE,
  id_categoria UUID REFERENCES categorias_de_gasto(id_categoria),
  descricao TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data TIMESTAMPTZ DEFAULT now(),
  status status_despesa DEFAULT 'PENDENTE',
  url_comprovante TEXT,
  notas_admin TEXT
);
```

### Tabela `solicitacoes_de_verba`

```sql
CREATE TABLE solicitacoes_de_verba (
  id_solicitacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card UUID REFERENCES cards_de_obra(id_card) ON DELETE CASCADE,
  id_solicitante UUID REFERENCES auth.users(id),
  valor DECIMAL(15, 2) NOT NULL,
  justificativa TEXT NOT NULL,
  status status_solicitacao_verba DEFAULT 'PENDENTE',
  data_solicitacao TIMESTAMPTZ DEFAULT now(),
  data_resposta TIMESTAMPTZ,
  notas_admin TEXT
);
```

---

## 🎨 Interface

### Página Principal (`/cards-de-obra`)

#### **Header**
- Botão "Voltar" (← Dashboard)
- Título: "Gestão de Cards de Obra" (Admin) ou "Meus Cards de Obra" (Visualizador)
- Botão "Novo Card" (somente Admin)

#### **Filtros e Busca**
- Campo de busca por título ou cliente
- Filtros rápidos:
  - Todos
  - Em Andamento
  - Aguardando Verba
  - Em Análise

#### **Grid de Cards**
- Layout responsivo (3 colunas desktop, 1 coluna mobile)
- Cada card mostra:
  - Título e cliente
  - Badge de status com ícone
  - Resumo financeiro (Orçamento / Saldo / Gasto)
  - Barra de progresso (% do orçamento gasto)
- Clique abre modal de detalhes

#### **Modal de Detalhes**
- **Resumo Financeiro:**
  - Orçamento Total
  - Saldo Atual (verde)
  - Total Gasto (vermelho)
- **Ações:** Botões contextuais por role
- **Despesas:** Lista com categoria, data, valor, status
- **Solicitações:** Histórico de pedidos de verba

---

## 🔐 Segurança (RLS)

### Admin
- **SELECT**: Todos os cards
- **INSERT**: Pode criar cards
- **UPDATE**: Pode editar qualquer card
- **DELETE**: Pode remover cards (em cascata com despesas)

### Visualizador
- **SELECT**: Apenas cards onde `id_visualizador_responsavel = auth.uid()`
- **INSERT**: Não pode criar cards
- **UPDATE**: Pode atualizar status (finalizar obra)
- **DELETE**: Não pode deletar

### Despesas de Obra
- Admin vê todas
- Visualizador vê apenas de seus cards

---

## 📱 Responsividade

- **Desktop:** Grid de 3 colunas
- **Tablet:** Grid de 2 colunas
- **Mobile:** 1 coluna, botões empilhados

---

## 🎯 Próximos Passos

### 1. Upload de Comprovantes
- Integrar Supabase Storage
- Bucket: `comprovantes`
- Path: `{user_id}/obras/{card_id}/comprovante_{timestamp}.jpg`
- Preview de imagens/PDFs

### 2. Fila de Aprovação (Admin)
- Página dedicada para solicitações pendentes
- Notificações em tempo real

### 3. Página de Análise (Admin)
- Lista de cards `EM_ANALISE`
- Interface para revisar despesas individualmente
- Botão de fechamento com confirmação

### 4. Dashboard de Rentabilidade
- Gráficos de lucratividade por obra
- Comparação orçamento vs realizado
- Top obras mais rentáveis

---

## 🎉 Status Atual

✅ **Implementado:**
- Página completa com views admin/visualizador
- Criação de cards
- Transferência de verba
- Registro de despesas (sem upload ainda)
- Solicitação de verba
- Finalização de obra
- Modais e filtros
- Design responsivo

⏳ **Pendente:**
- Upload de comprovantes
- Aprovação de solicitações de verba
- Fila de análise admin
- Fechamento automático com retorno de verba
- Cálculo de rentabilidade

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema de Cards de Obra, consulte este documento ou a documentação principal do sistema financeiro.
