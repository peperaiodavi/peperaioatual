# 🚀 Guia Rápido - Numeração Automática de Propostas

## ⚡ O que mudou?

### ✅ Antes
- Você digitava manualmente: `2025 570-R04`
- Podia errar o número
- Não havia controle de revisões

### ✨ Agora
- **Número gerado automaticamente ao exportar PDF**: `2025 571-R01`
- **Preview do próximo número**: Mostra qual será o próximo (mas não reserva)
- **Incremento só ao exportar**: O número só aumenta quando você realmente exporta o PDF
- **Revisões automáticas**: Cada edição incrementa a revisão (R01 → R02 → R03)
- **Números nunca se repetem**: Mesmo deletando propostas, não reutiliza números

## 📋 Como usar

### 1️⃣ Criar Nova Proposta
1. Acesse **Automação de PDF**
2. O número aparece como preview (ex: `2025 571-R01`)
3. **Campo bloqueado** - sem edição manual
4. Preencha os outros dados normalmente
5. **Clique em Exportar PDF** → Só agora o número é reservado!
6. Se você sair sem exportar, o número não é usado

### 2️⃣ Editar Proposta
1. Vá em **Propostas**
2. Clique em **Editar** na proposta desejada
3. Veja no campo: "Revisão atual: R01 → Próxima revisão: R02"
4. Faça as alterações necessárias
5. Ao clicar em **Salvar**, a revisão aumenta automaticamente
6. Mensagem confirmará: "Proposta atualizada! Nova revisão: R02"

### 3️⃣ Visualizar Revisões
- Na lista de propostas, cada card mostra um badge azul com a revisão atual
- Exemplo: **R02** significa segunda versão da proposta

### 4️⃣ Deletar Proposta
- Ao deletar, o número NÃO é reutilizado
- Exemplo: Se você deleta a proposta 572, a próxima será 573 (não volta para 572)

## 🔧 Instalação (EXECUTE APENAS UMA VEZ!)

### No Supabase SQL Editor:

**1. Primeiro script** (se ainda não executou):
```sql
-- Cole o conteúdo de: database/create_propostas_table.sql
```

**2. Segundo script** (NOVO - OBRIGATÓRIO):
```sql
-- Cole o conteúdo de: database/add_revisao_field.sql
```

## 🎯 Exemplos Práticos

### Sequência de uma proposta:
```
Criar → 2025 571-R01
Editar → 2025 571-R02 (mantém 571, aumenta revisão)
Editar → 2025 571-R03
```

### Múltiplas propostas:
```
Cliente A → 2025 570-R01
Cliente B → 2025 571-R01 (novo número sequencial)
Editar Cliente A → 2025 570-R02
Cliente C → 2025 572-R01
```

## 💡 Dicas

- ✅ O ano é atualizado automaticamente
- ✅ O número sequencial nunca repete
- ✅ Cada proposta mantém seu número base (570, 571...)
- ✅ Apenas a revisão (R01, R02...) muda ao editar
- ⚠️ Não delete propostas antigas, pois os números não são reutilizados

## 🐛 Problemas?

### "Carregando próximo número..."
- Verifique a conexão com Supabase
- Execute o script `add_revisao_field.sql`

### Número não incrementa
- Certifique-se de que executou ambos os scripts SQL
- Reinicie o servidor de desenvolvimento

---

📖 **Documentação completa**: `docs/NUMERACAO_AUTOMATICA_PROPOSTAS.md`
