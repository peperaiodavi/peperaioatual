# 🔧 TROUBLESHOOTING: Arquivamento Somando no Saldo

## Problema
Ao arquivar transações de um mês, o valor arquivado está sendo SOMADO ao saldo do caixa ao invés de ser removido.

## Diagnóstico

### 1. Abra o Console do Navegador (F12)
Quando você arquivar um mês, veja os logs:

```
💰 SALDO ANTES DO ARQUIVAMENTO: [valor]
📊 Total de transações no caixa: [número]
📅 Arquivando mês: 2024-10
📦 Encontradas [X] transações para arquivar
💰 Total Entradas: [valor] Total Saídas: [valor]
✅ Transações inseridas em transacoes_arquivadas
🔍 IDs: [lista de IDs]
📋 Transações encontradas antes do delete: [número]
🗑️ Executando DELETE de [X] transações...
✅ Transações removidas do caixa: [número]
✅ CONFIRMADO: Todas as transações foram deletadas
💰 SALDO DEPOIS DO ARQUIVAMENTO: [valor]
📊 Total de transações restantes: [número]
📉 Diferença de saldo: [diferença]
```

### 2. Verifique os Valores

**SE o log mostrar:**
- ✅ "CONFIRMADO: Todas as transações foram deletadas" 
- ✅ Saldo DEPOIS menor que saldo ANTES
- ❌ MAS o saldo na tela ainda mostra o valor errado

**ENTÃO**: O problema é de CACHE ou estado React

**SE o log mostrar:**
- ❌ "Transações removidas do caixa: 0"
- ❌ Saldo DEPOIS igual ao saldo ANTES

**ENTÃO**: O problema é de PERMISSÃO no Supabase (RLS Policy)

## Soluções

### Solução 1: Problema de Permissão (RLS)

Execute o SQL no Supabase:

```bash
1. Vá para: Supabase Dashboard > SQL Editor
2. Abra o arquivo: database/fix_transacoes_delete_policy.sql
3. Execute o SQL completo
4. Teste arquivar novamente
```

### Solução 2: Problema de Cache

O código já força `window.location.reload()` após arquivar.

Se ainda assim não funcionar:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Teste em aba anônima

### Solução 3: Verificar no Supabase

1. Vá para: Supabase Dashboard > Table Editor
2. Abra a tabela `transacoes`
3. ANTES de arquivar: Conte quantas transações existem
4. Arquive o mês
5. DEPOIS de arquivar: Conte novamente
6. As transações do mês devem ter SUMIDO da tabela `transacoes`
7. Devem aparecer na tabela `transacoes_arquivadas`

## Como Deve Funcionar

### Correto ✅
```
Antes: 100 transações no caixa, saldo R$ 50.000
Arquivar outubro (10 transações, saldo R$ 5.000)
Depois: 90 transações no caixa, saldo R$ 45.000
```

### Errado ❌
```
Antes: 100 transações no caixa, saldo R$ 50.000
Arquivar outubro (10 transações, saldo R$ 5.000)
Depois: 100 transações no caixa, saldo R$ 55.000 (SOMOU!)
```

## Próximos Passos

1. ✅ Arquive um mês
2. ✅ Copie TODOS os logs do console
3. ✅ Envie os logs para análise
4. ✅ Informe qual dos cenários acima aconteceu
