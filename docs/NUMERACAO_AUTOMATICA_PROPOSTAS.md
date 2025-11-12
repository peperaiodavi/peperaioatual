# Sistema de Numeração Automática de Propostas

## 📋 Visão Geral

O sistema agora gerencia automaticamente a numeração das propostas, eliminando a necessidade de inserção manual e garantindo sequência sem duplicatas.

## 🔢 Formato da Numeração

```
[ANO] [SEQUENCIAL]-R[REVISÃO]
Exemplo: 2025 570-R01
```

### Componentes:
- **ANO**: Ano atual (gerado automaticamente)
- **SEQUENCIAL**: Número incremental (570, 571, 572...)
- **REVISÃO**: Número da revisão (R01, R02, R03...)

## ⚙️ Como Funciona

### 1. Criação de Nova Proposta
Ao abrir a página de **Automação de PDF**:
- O sistema busca automaticamente o próximo número disponível
- O campo "Número da Proposta" é **somente leitura**
- Formato inicial: `[ANO ATUAL] [PRÓXIMO NÚMERO]-R01`

**Exemplo:**
- Se a última proposta foi `2025 570-R03`
- Nova proposta será: `2025 571-R01`

### 2. Edição de Proposta Existente
Na aba **Propostas**, ao clicar em **Editar**:
- O número sequencial é mantido
- A revisão é incrementada automaticamente ao salvar
- Uma mensagem mostra: "Revisão atual: R01 → Próxima revisão: R02"

**Exemplo de evolução:**
1. Criação inicial: `2025 570-R01`
2. Primeira edição: `2025 570-R02`
3. Segunda edição: `2025 570-R03`
4. Nova proposta: `2025 571-R01`

## 📊 Estrutura do Banco de Dados

### Novos Campos
```sql
numero_sequencial INTEGER  -- Ex: 570, 571, 572
numero_revisao INTEGER     -- Ex: 1, 2, 3 (exibido como R01, R02, R03)
```

### Índices
- `idx_propostas_numero_sequencial` - Otimiza busca do próximo número

## 🚀 Instalação

Execute o script SQL no Supabase:
```bash
database/add_revisao_field.sql
```

## 💡 Benefícios

✅ **Sem erros de numeração** - Sistema garante sequência correta  
✅ **Histórico de revisões** - Cada edição incrementa automaticamente  
✅ **Rastreabilidade** - Fácil identificar versões da proposta  
✅ **Sem duplicatas** - Números sequenciais únicos  
✅ **Interface clara** - Badge visual mostra revisão atual  

## 🎨 Interface

### Automação de PDF
- Campo desabilitado com estilo cinza
- Texto: "Número da Proposta (Gerado Automaticamente)"
- Tooltip explicativo

### Aba Propostas
- Badge azul mostrando revisão atual (ex: R02)
- Badge verde para propostas finalizadas
- Aviso no dialog de edição sobre próxima revisão

## 🔄 Fluxo Completo

```
1. Criar Proposta
   └─> AutomacaoPdf.tsx
       └─> Gera: 2025 571-R01
       └─> Salva no banco com numero_sequencial=571, numero_revisao=1

2. Editar Proposta
   └─> Propostas.tsx → Botão Editar
       └─> Mostra: "Revisão atual: R01 → Próxima: R02"
       └─> Ao salvar: Atualiza para 2025 571-R02
       └─> Incrementa numero_revisao=2

3. Nova Proposta
   └─> AutomacaoPdf.tsx
       └─> Busca max(numero_sequencial) = 571
       └─> Gera: 2025 572-R01
```

## 🐛 Troubleshooting

### Número não aparece
- Verifique se o script SQL foi executado
- Confirme se há conexão com Supabase
- Veja o console para erros

### Número não incrementa
- Execute: `SELECT MAX(numero_sequencial) FROM propostas;`
- Se retornar NULL, o sistema começará de 570

### Revisão não incrementa ao editar
- Verifique se o campo `numero_revisao` existe na tabela
- Confirme que o update está salvando corretamente

## 📝 Notas Técnicas

- **Número inicial**: 570 (configurável no código)
- **Formato zero-padded**: R01, R02... R99
- **Performance**: Índice otimiza busca do próximo número
- **Concurrent Safety**: Use transactions se múltiplos usuários criarem propostas simultaneamente
