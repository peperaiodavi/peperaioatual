# Sistema de Arquivamento - Como Funciona

## ⚠️ IMPORTANTE: Execute os SQLs Primeiro

Antes de usar o sistema de arquivamento, você precisa executar 2 scripts SQL no Supabase:

### 1. Adicionar campo `arquivado` na tabela transacoes

```sql
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_transacoes_arquivado 
ON transacoes(arquivado);
```

### 2. Adicionar campo `id_original` na tabela transacoes_arquivadas

```sql
ALTER TABLE transacoes_arquivadas 
ADD COLUMN IF NOT EXISTS id_original UUID;

CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_id_original 
ON transacoes_arquivadas(id_original);
```

**Execute ambos os comandos no Supabase SQL Editor antes de testar!**

## 🎯 Como Funciona

### Arquivar Transações

Quando você arquiva transações de um mês:

1. **As transações são MARCADAS como arquivadas** (campo `arquivado = true`)
2. **Desaparecem da visualização do caixa** (filtro `.eq('arquivado', false)`)
3. **O saldo NÃO muda** (transações continuam na tabela `transacoes`)
4. **Uma cópia é salva** em `transacoes_arquivadas` para histórico

### Restaurar Transações

Quando você restaura transações arquivadas:

1. **As transações são DESMARCADAS** (campo `arquivado = false`)
2. **Voltam a aparecer no caixa** automaticamente
3. **O saldo continua o mesmo** (nunca saíram da tabela)
4. **A cópia do arquivo é removida** de `transacoes_arquivadas`

## 📊 Visualização

### Caixa Principal
- Mostra apenas transações com `arquivado = false`
- Calcula saldo de TODAS as transações (incluindo arquivadas)

### Aba Arquivos
- Mostra pastas por mês/ano
- Dentro de cada pasta: transações arquivadas daquele período
- Botões: Restaurar, Deletar, Gerar PDF

## 💰 Saldo

O saldo SEMPRE considera todas as transações na tabela `transacoes`, independente do campo `arquivado`:

```typescript
const calcularSaldo = () => {
  // Busca TODAS as transações (sem filtro de arquivado)
  supabase.from('transacoes').select('*')
  // Calcula entradas - saídas
  return total;
}
```

Isso garante que arquivar/restaurar não afeta o saldo, apenas a visualização.

## 🔄 Fluxo Completo

```
ARQUIVAR:
Transação visível no caixa 
→ Marca arquivado=true
→ Copia para transacoes_arquivadas
→ Desaparece do caixa (filtro)
→ Saldo continua igual

RESTAURAR:
Transação em pasta de arquivo
→ Marca arquivado=false
→ Remove de transacoes_arquivadas
→ Volta a aparecer no caixa
→ Saldo continua igual
```

## 🎨 Benefícios

✅ **Organização**: Limpa transações antigas da visualização
✅ **Segurança**: Não perde dados (só oculta)
✅ **Saldo correto**: Sempre calcula todas as transações
✅ **Reversível**: Pode restaurar a qualquer momento
✅ **Histórico**: Mantém cópia organizada por mês/ano

## 🚨 Avisos

- ⚠️ Se não executar o SQL, o sistema dará erro (campo `arquivado` não existe)
- ⚠️ Deletar um arquivo é permanente (remove da tabela `transacoes_arquivadas`)
- ⚠️ O saldo SEMPRE inclui transações arquivadas (por design)
