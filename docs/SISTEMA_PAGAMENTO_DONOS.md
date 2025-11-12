# Sistema de Pagamento dos Donos

## 🎯 Visão Geral

Sistema implementado para gerenciar pagamentos dos sócios (Marcos Paulo e Isaac) através do módulo de Funcionários, permitindo transferir valores do caixa empresarial para seus dashboards pessoais.

## ✨ Funcionalidades

### 1. Edição de Salário Mensal
- **Localização**: Card do dono > Ver Detalhes > Botão "Editar Salário"
- **Valor Inicial**: R$ 5.000,00
- **Descrição**: Define o salário mensal de referência para cada dono
- **Estilo**: Botão com gradiente turquesa com efeito de pulso animado

### 2. Efetuar Pagamento
- **Localização**: Card do dono > Ver Detalhes > Botão "Efetuar Pagamento"
- **Descrição**: Transfere valor do caixa empresarial para o dashboard pessoal
- **Fluxo**:
  1. Registra saída no caixa empresarial (categoria: "Pagamento Sócios")
  2. Registra entrada no dashboard pessoal do dono
  3. Permite observação personalizada
- **Estilo**: Botão com gradiente roxo com efeito de pulso animado

## 🔧 Configuração Inicial

### Passo 1: Executar Script SQL
Execute o script `database/setup_donos_pagamento.sql` no Supabase:

```sql
-- O script irá:
-- 1. Configurar emails dos donos
-- 2. Definir salário inicial de R$ 5.000,00
-- 3. Vincular usuario_id dos usuários cadastrados
-- 4. Verificar configurações
```

### Passo 2: Verificar Usuários
Certifique-se de que os seguintes usuários existem na tabela `usuarios`:
- **Marcos Paulo**: marcospaulopeperaio@gmail.com
- **Isaac**: isaacpeperaio@gmail.com

### Passo 3: Verificar Categorias no Caixa
Certifique-se de que existe a categoria "Pagamento Sócios" nas transações.

## 📋 Estrutura de Dados

### Tabela `funcionarios`
```sql
- email: VARCHAR (ex: marcospaulopeperaio@gmail.com)
- usuario_id: UUID (vínculo com tabela usuarios)
- salario_mensal: NUMERIC (valor de referência)
- categoria: VARCHAR ('dono')
```

### Tabela `transacoes` (Caixa Empresarial)
```sql
- tipo: 'saida'
- categoria: 'Pagamento Sócios'
- valor: NUMERIC
- data: DATE
- observacao: TEXT
```

### Tabela `transacoes_pessoais` (Dashboard Pessoal)
```sql
- usuario_id: UUID
- tipo: 'entrada'
- categoria: 'Salário'
- valor: NUMERIC
- data: DATE
- observacao: TEXT
```

## 🎨 Design e Estilo

### Botões com Efeitos Especiais
- **Efeito de Pulso**: Animação contínua chamando atenção
- **Hover com Ripple**: Efeito de onda ao passar o mouse
- **Gradientes Vibrantes**: 
  - Pagamento: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Salário: `linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%)`

### Modais (Dialogs)
- Design consistente com outros modais do sistema
- Campos com ícones ilustrativos
- Botões de submit com animações de pulso
- Informações contextuais (💡 dicas)

## 🔐 Segurança e Permissões

### Requisitos para Visualizar Botões
1. Funcionário deve ter `categoria = 'dono'`
2. Email deve ser 'marcospaulopeperaio@gmail.com' OU 'isaacpeperaio@gmail.com'
3. Deve ter `usuario_id` vinculado
4. Usuário logado deve ter permissão `canCreate` (admin)

### Validações
- Valores devem ser maiores que zero
- Data é obrigatória
- usuario_id deve existir na tabela usuarios

## 📱 Uso Prático

### Cenário 1: Pagamento Mensal
1. Acesse "Funcionários" no menu principal
2. Localize o card do dono (Marcos ou Isaac)
3. Clique em "Ver Detalhes"
4. Clique em "Efetuar Pagamento"
5. Preencha:
   - Valor: R$ 5.000,00 (ou valor desejado)
   - Data: Data do pagamento
   - Observação: "Pagamento de salário mensal - [Mês/Ano]"
6. Clique em "Transferir Valor"

### Cenário 2: Ajuste de Salário
1. Acesse "Funcionários" no menu principal
2. Localize o card do dono
3. Clique em "Ver Detalhes"
4. Clique em "Editar Salário"
5. Insira o novo valor (ex: R$ 6.000,00)
6. Clique em "Atualizar Salário"

### Cenário 3: Retirada Extraordinária
1. Siga passos 1-4 do Cenário 1
2. Preencha:
   - Valor: Valor da retirada
   - Data: Data da retirada
   - Observação: "Retirada extraordinária - [Motivo]"
3. Clique em "Transferir Valor"

## 🔍 Verificação e Auditoria

### Verificar Saldo Empresarial
- Acesse "Caixa" no menu principal
- Filtro por categoria "Pagamento Sócios"
- Visualize todas as saídas registradas

### Verificar Recebimentos Pessoais
- Faça login com a conta do dono
- Acesse "Financeiro Pessoal"
- Visualize entradas na categoria "Salário"

### SQL para Auditoria
```sql
-- Ver todos os pagamentos dos últimos 30 dias
SELECT 
  t.data,
  f.nome as dono,
  t.valor,
  t.observacao,
  tp.id as entrada_pessoal_id
FROM transacoes t
JOIN funcionarios f ON t.observacao ILIKE '%' || f.nome || '%'
LEFT JOIN transacoes_pessoais tp ON tp.data = t.data AND tp.valor = t.valor
WHERE t.categoria = 'Pagamento Sócios'
  AND t.tipo = 'saida'
  AND t.data >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY t.data DESC;
```

## 🐛 Troubleshooting

### Botões não aparecem
✅ Verifique se:
1. Email está correto na tabela funcionarios
2. usuario_id está vinculado
3. Categoria é 'dono'
4. Usuário logado tem permissão de admin

### Erro ao transferir
✅ Verifique se:
1. Há saldo suficiente no caixa
2. usuario_id do dono existe na tabela usuarios
3. Categoria "Pagamento Sócios" existe
4. Permissões RLS estão configuradas corretamente

### Valor não aparece no dashboard pessoal
✅ Verifique se:
1. Login está correto (mesmo email do funcionario.usuario_id)
2. Transação foi registrada na tabela transacoes_pessoais
3. Data está correta
4. RLS policies permitem leitura do próprio usuário

## 🚀 Melhorias Futuras

- [ ] Relatório de pagamentos mensais automatizado
- [ ] Notificação automática ao dono após pagamento
- [ ] Histórico de alterações de salário
- [ ] Exportação de comprovantes em PDF
- [ ] Dashboard de previsão de pagamentos
- [ ] Integração com calendário para pagamentos recorrentes

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Código fonte: `src/pages/Funcionarios.tsx`
- Estilos: `src/pages/Funcionarios.css`
- Scripts SQL: `database/setup_donos_pagamento.sql`
