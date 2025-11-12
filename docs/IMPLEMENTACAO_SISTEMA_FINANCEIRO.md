# 🚀 Guia de Implementação - Sistema Financeiro Completo

## 📋 Índice
1. [Executar SQL no Supabase](#1-executar-sql-no-supabase)
2. [Configurar Storage para Comprovantes](#2-configurar-storage)
3. [Testar o Sistema](#3-testar-o-sistema)
4. [Funcionalidades Implementadas](#4-funcionalidades)

---

## 1️⃣ Executar SQL no Supabase

### Passo 1: Acessar o SQL Editor
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto **Peperaio**
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script
1. Abra o arquivo `database/sistema_financeiro_completo.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar a Execução
Após executar, verifique se foram criados:

#### ✅ Enums (Tipos)
- `tx_type` (ENTRADA, SAIDA)
- `expense_status` (PENDENTE, APROVADO, REPROVADO)
- `project_status` (PENDENTE, EM_ANDAMENTO, AGUARDANDO_VERBA, EM_ANALISE, FINALIZADO, CANCELADO)
- `fund_request_status` (PENDENTE, APROVADO, REPROVADO)
- `user_role` (admin, visualizador)

#### ✅ Tabelas
1. **transacoes_pessoais** - Finanças pessoais (isoladas por RLS)
2. **caixa_adiantamento** - Caixa de adiantamento dos visualizadores
3. **despesas_adiantamento** - Gastos do caixa de adiantamento
4. **categorias_de_gasto** - Categorias de despesas (com 7 categorias padrão)
5. **cards_de_obra** - Centro de custo (projetos)
6. **despesas_de_obra** - Despesas específicas de cada projeto
7. **solicitacoes_de_verba** - Solicitações de verba para projetos

#### ✅ Políticas RLS
Todas as tabelas têm políticas de Row Level Security configuradas:
- **Admin**: Vê tudo
- **Visualizador**: Vê apenas seus próprios dados
- **Finanças Pessoais**: 100% isoladas (nem admin vê)

---

## 2️⃣ Configurar Storage para Comprovantes

### Passo 1: Criar o Bucket
1. No Supabase Dashboard, vá em **Storage**
2. Clique em **Create bucket**
3. Nome do bucket: `comprovantes`
4. Marque como **Public** (para permitir visualização de comprovantes)
5. Clique em **Create bucket**

### Passo 2: Configurar Políticas do Bucket

#### Política 1: Visualizadores Fazem Upload
```sql
-- Permitir que visualizadores façam upload em suas próprias pastas
CREATE POLICY "Visualizadores fazem upload em suas pastas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Política 2: Admin Faz Upload em Qualquer Pasta
```sql
-- Permitir que admin faça upload em qualquer pasta
CREATE POLICY "Admin faz upload em qualquer pasta"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Política 3: Usuários Visualizam Seus Comprovantes
```sql
-- Permitir que usuários vejam seus próprios comprovantes
CREATE POLICY "Usuários visualizam seus comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Política 4: Admin Visualiza Todos os Comprovantes
```sql
-- Permitir que admin veja todos os comprovantes
CREATE POLICY "Admin visualiza todos os comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Passo 3: Estrutura de Pastas
Os comprovantes serão organizados assim:
```
comprovantes/
├── {user_id}/
│   ├── adiantamento/
│   │   ├── comprovante_1.jpg
│   │   └── comprovante_2.pdf
│   └── obras/
│       ├── {card_id}/
│       │   ├── comprovante_1.jpg
│       │   └── comprovante_2.jpg
```

---

## 3️⃣ Testar o Sistema

### Teste 1: Verificar Tabelas
Execute no SQL Editor:
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'transacoes_pessoais',
  'caixa_adiantamento',
  'despesas_adiantamento',
  'categorias_de_gasto',
  'cards_de_obra',
  'despesas_de_obra',
  'solicitacoes_de_verba'
);
```

### Teste 2: Verificar Categorias Padrão
```sql
-- Deve retornar 7 categorias
SELECT * FROM public.categorias_de_gasto;
```

### Teste 3: Verificar RLS
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename LIKE '%obra%' OR tablename LIKE '%pessoal%';
```

### Teste 4: Adicionar Role a um Usuário (Exemplo)
```sql
-- Atualizar role de um usuário específico
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'SEU_USER_ID_AQUI';
```

---

## 4️⃣ Funcionalidades Implementadas

### 🎯 Dashboard Selector
**Arquivo**: `src/pages/DashboardSelector.tsx`

Interface linda e moderna para escolher entre:
- 🏢 **Dashboard Empresarial** (Caixa Principal, Cards de Obra, Adiantamentos)
- 💰 **Meu Financeiro Pessoal** (Receitas, Despesas, Análises)

**Recursos**:
- Animações suaves de entrada
- Design responsivo
- Ícones intuitivos
- Gradientes e efeitos glassmorphism

---

### 💎 Financeiro Pessoal
**Arquivo**: `src/pages/FinanceiroPessoal.tsx`

Dashboard financeiro pessoal **100% privado** com:

#### Recursos:
✅ **3 Cards de Resumo**
   - Saldo Atual (positivo/negativo)
   - Total de Entradas
   - Total de Saídas

✅ **Sistema de Filtros**
   - Todos
   - Apenas Entradas
   - Apenas Saídas

✅ **Lista de Transações**
   - Ordenadas por data (mais recente primeiro)
   - Ícones coloridos (verde para entradas, vermelho para saídas)
   - Informações de data e valor
   - Animações de hover

✅ **Modal de Nova Transação**
   - Seletor de tipo (Entrada/Saída)
   - Campo de descrição
   - Campo de valor (número com decimais)
   - Seletor de data
   - Validação de campos

✅ **Segurança RLS**
   - Cada usuário vê APENAS suas transações
   - Nem o admin consegue acessar finanças pessoais de outros

---

### 🎨 Design System

#### Paleta de Cores
- **Background**: Gradiente escuro (#0f172a → #1e293b)
- **Primário**: Azul (#60a5fa)
- **Sucesso/Entradas**: Verde (#34d399)
- **Erro/Saídas**: Vermelho (#ef4444)
- **Texto Primário**: Branco (#ffffff)
- **Texto Secundário**: Cinza claro (#cbd5e1)

#### Componentes UI
- **Cards**: Glassmorphism com blur
- **Botões**: Gradientes com sombras
- **Modais**: Backdrop blur + animações
- **Inputs**: Bordas animadas no focus
- **Badges**: Coloridos por status

#### Animações
- Fade in/out
- Slide up/down
- Hover effects
- Pulse backgrounds
- Smooth transitions

---

## 5️⃣ Próximos Passos

### 🚧 Funcionalidades Pendentes

#### A Implementar:
1. **Caixa de Adiantamento** (visualizador)
   - Visualizar saldo
   - Registrar despesas com comprovante
   - Upload de imagens/PDFs

2. **Cards de Obra - Visualizador**
   - Lista de projetos atribuídos
   - Detalhes do projeto (orçamento, saldo, gastos)
   - Registrar despesas com categorias
   - Upload de comprovantes
   - Solicitar verba adicional
   - Finalizar obra (enviar para análise)

3. **Cards de Obra - Admin**
   - Criar novos projetos
   - Atribuir visualizador responsável
   - Transferir verba inicial
   - Aprovar solicitações de verba
   - Visão geral de todos os projetos

4. **Fila de Análise (Admin)**
   - Listar obras finalizadas
   - Revisar cada despesa
   - Visualizar comprovantes
   - Aprovar/Reprovar gastos
   - Fechar obra (calcular rentabilidade)
   - Retornar saldo restante ao caixa principal

5. **Sistema de Notificações**
   - Notificar admin de novas solicitações
   - Notificar visualizador de aprovações
   - Badge com contador de pendências

---

## 📝 Notas Importantes

### Segurança
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas específicas por role (admin/visualizador)
- ✅ Finanças pessoais 100% isoladas
- ✅ Validação de permissões no backend

### Performance
- ✅ Índices criados nas colunas mais consultadas
- ✅ Queries otimizadas com filtros
- ✅ Lazy loading de imagens (quando implementado)

### Responsividade
- ✅ Design mobile-first
- ✅ Grid adaptativo
- ✅ Modais responsivos
- ✅ Touch-friendly

---

## 🆘 Troubleshooting

### Erro: "relation does not exist"
**Solução**: Verifique se o script SQL foi executado completamente. Execute novamente.

### Erro: "permission denied for table"
**Solução**: Verifique se as políticas RLS foram criadas. Execute a seção de RLS do script novamente.

### Erro ao fazer upload
**Solução**: Verifique se o bucket "comprovantes" foi criado e as políticas configuradas.

### Usuário não tem role
**Solução**: Execute:
```sql
UPDATE public.profiles 
SET role = 'admin' -- ou 'visualizador'
WHERE id = 'SEU_USER_ID';
```

---

## 📧 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase Dashboard
3. Teste as queries manualmente no SQL Editor

---

**Desenvolvido com ❤️ para Peperaio**
