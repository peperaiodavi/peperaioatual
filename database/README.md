# Configuração do Banco de Dados - Propostas

Este diretório contém os scripts SQL necessários para configurar a funcionalidade de Propostas no sistema.

## 📁 Scripts Disponíveis

1. **`create_propostas_table.sql`** - Cria a tabela inicial de propostas
2. **`add_revisao_field.sql`** - Adiciona sistema de numeração automática
3. **`fix_numero_sequencial.sql`** - Garante que números nunca sejam reutilizados (IMPORTANTE!)

## Como aplicar os scripts no Supabase

### Passo 1: Criar a tabela principal

#### Método 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o dashboard do seu projeto no Supabase (https://app.supabase.com)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `create_propostas_table.sql`
5. Cole no editor SQL
6. Clique em **Run** ou pressione `Ctrl + Enter`
7. Verifique se a mensagem de sucesso aparece

### Passo 2: Adicionar numeração automática

1. No mesmo **SQL Editor**
2. Clique em **New Query** novamente
3. Copie todo o conteúdo do arquivo `add_revisao_field.sql`
4. Cole no editor SQL
5. Clique em **Run**

### Passo 3: Proteger contra reutilização de números (OBRIGATÓRIO!)

1. No **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `fix_numero_sequencial.sql`
4. Cole no editor SQL
5. Clique em **Run**
6. Isso cria uma tabela de controle que garante que números nunca sejam reutilizados

### Método 2: Via CLI do Supabase

Se você tem o Supabase CLI instalado:

```bash
# Execute os scripts na ordem
supabase db execute -f database/create_propostas_table.sql
supabase db execute -f database/add_revisao_field.sql
supabase db execute -f database/fix_numero_sequencial.sql
```

## Estrutura da Tabela `propostas`

A tabela `propostas` armazena todas as propostas comerciais geradas pelo sistema com os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único da proposta (gerado automaticamente) |
| cliente_nome | TEXT | Nome da empresa cliente |
| cliente_contato | TEXT | Nome do contato do cliente |
| proposta_numero | TEXT | Número completo da proposta (ex: 2025 570-R04) |
| **numero_sequencial** | **INTEGER** | **Número sequencial (570, 571, 572...)** |
| **numero_revisao** | **INTEGER** | **Número da revisão (1=R01, 2=R02, 3=R03...)** |
| data_emissao | TEXT | Data de emissão da proposta |
| escopo_fornecimento | TEXT | Descrição completa do escopo de fornecimento |
| condicoes_pagamento | TEXT | Condições de pagamento da proposta |
| price_items | JSONB | Array JSON com os itens de preço |
| valor_total_extenso | TEXT | Valor total da proposta por extenso |
| prazo_garantia_meses | TEXT | Prazo de garantia em meses |
| finalizada | BOOLEAN | Indica se a proposta foi convertida em obra |
| created_at | TIMESTAMP | Data de criação do registro |
| updated_at | TIMESTAMP | Data da última atualização |

### Exemplo de `price_items` (JSONB)

```json
[
  {
    "id": "1",
    "descricao": "Material e mão de obra",
    "qtde": "1",
    "valor": "15300.00"
  },
  {
    "id": "2",
    "descricao": "Instalação elétrica",
    "qtde": "2",
    "valor": "5000.00"
  }
]
```

## Índices Criados

O script cria os seguintes índices para otimizar as consultas:

- `idx_propostas_proposta_numero`: Para buscar por número da proposta
- `idx_propostas_cliente_nome`: Para buscar por nome do cliente
- `idx_propostas_finalizada`: Para filtrar propostas finalizadas/não finalizadas
- `idx_propostas_created_at`: Para ordenar por data de criação

## Segurança (RLS)

O script habilita Row Level Security (RLS) e cria políticas que permitem:

- ✅ Usuários autenticados podem ver todas as propostas
- ✅ Usuários autenticados podem criar propostas
- ✅ Usuários autenticados podem atualizar propostas
- ✅ Usuários autenticados podem deletar propostas

⚠️ **Importante**: Ajuste as políticas de segurança conforme as necessidades específicas do seu projeto.

## Verificação

Após executar o script, você pode verificar se tudo foi criado corretamente executando:

```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'propostas';

-- Verificar os índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'propostas';

-- Verificar as políticas RLS
SELECT * 
FROM pg_policies 
WHERE tablename = 'propostas';
```

## Funcionalidades Implementadas

Com esta estrutura de banco de dados, o sistema agora suporta:

1. **Salvar propostas automaticamente** ao exportar PDF na página de Automação PDF
2. **Visualizar todas as propostas salvas** na página de Propostas
3. **Editar propostas existentes** antes de finalizá-las
4. **Reexportar PDF** de propostas já salvas com as alterações
5. **Finalizar proposta** convertendo-a em uma nova obra:
   - Solicita o nome da obra
   - Cria a obra com o valor total da proposta como orçamento
   - Marca a proposta como finalizada
6. **Deletar propostas** que não são mais necessárias

## Problemas Comuns

### Erro: "relation 'propostas' already exists"
A tabela já existe no banco. Você pode deletá-la primeiro com:
```sql
DROP TABLE IF EXISTS propostas CASCADE;
```
E então executar o script novamente.

### Erro de permissão
Certifique-se de que você está executando o script com um usuário que tem permissões suficientes (geralmente o usuário admin do projeto).
