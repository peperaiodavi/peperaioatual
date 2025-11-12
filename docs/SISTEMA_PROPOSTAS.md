# Sistema de Propostas - Documentação Completa

## 📋 Visão Geral

Este documento descreve as funcionalidades implementadas no sistema de propostas, que permite salvar, editar e converter propostas em obras.

## 🚀 Funcionalidades Implementadas

### 1. Exportar Proposta e Salvar no Banco
**Página:** Automação PDF (`/automacao-pdf`)

Quando você clica em **"Exportar Proposta"**:
- ✅ O sistema valida todos os campos obrigatórios
- ✅ Salva automaticamente a proposta no banco de dados
- ✅ Gera e baixa o PDF da proposta
- ✅ Exibe mensagem de sucesso

### 2. Visualizar Propostas Salvas
**Página:** Propostas (`/propostas`)

A nova página de Propostas permite:
- 📄 Visualizar todas as propostas salvas
- 🔍 Ver detalhes: número da proposta, cliente, contato, data e valor total
- 🏷️ Identificar propostas finalizadas com badge verde
- 🔄 Ordenadas da mais recente para a mais antiga

### 3. Editar Proposta
**Botão:** "Editar" em cada proposta não finalizada

Permite editar todos os campos da proposta:
- Nome do cliente
- Nome do contato
- Número da proposta
- Escopo de fornecimento
- Condições de pagamento
- **Itens de preço** (adicionar, remover e editar)
  - Descrição
  - Quantidade
  - Valor unitário
- Valor total por extenso
- Prazo de garantia em meses

### 4. Reexportar PDF
**Botão:** "PDF" em cada proposta

- 📥 Gera novamente o PDF com os dados atuais da proposta
- ✨ Mantém toda a formatação e padrões originais
- 💾 Baixa automaticamente o arquivo

### 5. Finalizar Proposta e Criar Obra
**Botão:** "Finalizar" em cada proposta não finalizada

Fluxo de finalização:
1. Clique em **"Finalizar"**
2. O sistema exibe um diálogo com:
   - Número da proposta
   - Valor total calculado
3. **Digite o nome da nova obra**
4. Clique em **"Criar Obra"**
5. O sistema:
   - ✅ Cria uma nova obra com o nome informado
   - ✅ Define o orçamento da obra = valor total da proposta
   - ✅ Marca a proposta como finalizada
   - ✅ A obra aparece na aba "Obras" (`/obras`)

### 6. Deletar Proposta
**Botão:** ❌ (vermelho) em cada proposta

- Permite remover propostas do sistema
- Requer permissão de "delete"
- Exige confirmação antes de deletar

## 🎯 Fluxo de Trabalho Completo

```
1. Criar Proposta
   └─> Página: Automação PDF
   └─> Preencher todos os campos
   └─> Clicar em "Exportar Proposta"
   └─> Proposta é salva + PDF é gerado

2. Visualizar Propostas
   └─> Acessar: Menu > Propostas
   └─> Ver lista de todas as propostas

3. Editar Proposta (se necessário)
   └─> Clicar em "Editar"
   └─> Modificar campos necessários
   └─> Adicionar/remover itens de preço
   └─> Salvar alterações

4. Reexportar PDF (se editou)
   └─> Clicar em "PDF"
   └─> Baixar nova versão

5. Finalizar Proposta
   └─> Clicar em "Finalizar"
   └─> Digitar nome da obra
   └─> Clicar em "Criar Obra"
   └─> Obra criada automaticamente!

6. Gerenciar Obra
   └─> Acessar: Menu > Obras
   └─> Obra aparece com orçamento já preenchido
   └─> Adicionar gastos, acompanhar lucro, etc.
```

## 🗂️ Estrutura de Menu

O menu agora inclui:
```
📊 Dashboard
👥 Funcionários
💳 Dívidas
🏗️  Obras
💰 Caixa
📄 A Receber
⚙️  Automação PDF
✅ Propostas          ← NOVO!
👤 Minha Conta
```

## 🗄️ Banco de Dados

### Tabela: `propostas`

Campos principais:
- `id` - Identificador único
- `cliente_nome` - Nome da empresa
- `cliente_contato` - Nome do contato
- `proposta_numero` - Número da proposta
- `data_emissao` - Data de emissão
- `escopo_fornecimento` - Descrição do serviço
- `condicoes_pagamento` - Condições de pagamento
- `price_items` - Array JSON com itens de preço
- `valor_total_extenso` - Valor por extenso
- `prazo_garantia_meses` - Prazo de garantia
- `finalizada` - Boolean (true/false)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Exemplo de `price_items`:
```json
[
  {
    "id": "1",
    "descricao": "Material e mão de obra",
    "qtde": "1",
    "valor": "15300.00"
  }
]
```

## ⚙️ Configuração Necessária

### 1. Criar a tabela no Supabase

Execute o script SQL no Supabase:
1. Acesse o SQL Editor no dashboard do Supabase
2. Abra o arquivo `database/create_propostas_table.sql`
3. Copie e cole todo o conteúdo
4. Execute o script

**OU** via terminal:
```bash
supabase db execute -f database/create_propostas_table.sql
```

### 2. Verificar Permissões

As políticas RLS estão configuradas para permitir que usuários autenticados:
- Vejam todas as propostas
- Criem novas propostas
- Editem propostas existentes
- Deletem propostas

## 🎨 Interface Visual

### Página de Propostas
- **Cards animados** com Motion/Framer
- **Badges** indicando status (Finalizada)
- **Botões de ação** intuitivos:
  - 📥 PDF - Azul claro
  - ✏️ Editar - Cinza
  - ✅ Finalizar - Verde
  - ❌ Deletar - Vermelho

### Dialog de Edição
- **Modal responsivo** com scroll
- **Grid de 2 colunas** para campos menores
- **Textarea** para campos grandes
- **Lista dinâmica** de itens de preço
- **Botões +/−** para adicionar/remover itens
- **Valor total calculado** automaticamente

### Dialog de Finalizar
- **Modal compacto**
- Exibe resumo da proposta
- Campo para nome da obra
- Botões de ação claros

## 🔒 Segurança e Permissões

O sistema respeita as permissões do contexto:
- `canCreate` - Necessário para criar propostas
- `canEdit` - Necessário para editar propostas
- `canDelete` - Necessário para deletar propostas

## 📱 Responsividade

Todas as interfaces são totalmente responsivas:
- Desktop: Layout em grid
- Tablet: Layout adaptável
- Mobile: Layout em coluna única

## 🐛 Tratamento de Erros

O sistema trata todos os erros possíveis:
- ❌ Campos obrigatórios não preenchidos
- ❌ Erro ao salvar no banco
- ❌ Erro ao gerar PDF
- ❌ Erro ao criar obra
- ❌ Falta de permissões

Todos os erros exibem mensagens claras para o usuário via toast.

## 📊 Integração com Obras

Quando uma proposta é finalizada:
1. Nova entrada criada na tabela `obras`
2. Campo `orcamento` = valor total da proposta
3. Campo `lucro` = 0 (inicial)
4. Campo `finalizada` = false
5. Campo `gastos` = array vazio

A obra pode então ser gerenciada normalmente na página de Obras.

## 🎉 Benefícios do Sistema

✅ **Organização**: Todas as propostas em um só lugar
✅ **Rastreabilidade**: Histórico completo de propostas
✅ **Eficiência**: Reutilizar e editar propostas facilmente
✅ **Integração**: Fluxo direto de proposta → obra
✅ **Profissionalismo**: PDFs padronizados e consistentes
✅ **Flexibilidade**: Editar antes de finalizar

## 🔄 Atualizações Futuras Possíveis

Sugestões de melhorias:
- [ ] Filtros e busca na lista de propostas
- [ ] Duplicar proposta existente
- [ ] Histórico de versões da proposta
- [ ] Enviar proposta por e-mail
- [ ] Anexar arquivos à proposta
- [ ] Status intermediários (Em análise, Aprovada, Rejeitada)
- [ ] Dashboard com métricas de propostas
- [ ] Notificações de propostas pendentes

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se a tabela `propostas` foi criada no Supabase
2. Verifique as políticas RLS no Supabase
3. Verifique o console do navegador para erros
4. Verifique se o usuário está autenticado

---

**Desenvolvido para PEPERAIO Comunicação Visual** 🎨
