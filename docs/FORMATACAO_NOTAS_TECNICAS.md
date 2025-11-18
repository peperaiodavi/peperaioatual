# Formatação de Texto nas Notas Técnicas

**Data:** 12/11/2025  
**Feature:** Formatação inline com negrito no Item 3 (Notas Técnicas) do PDF

---

## 🎨 Como Usar

### Sintaxe Simples

Use `**texto**` para deixar qualquer parte do texto em **negrito**:

```
Este é um texto normal e **este está em negrito**.
```

### Exemplos Práticos

#### Exemplo 1: Destacar palavras-chave
```
3.1 para elaboração da presente proposta consideramos as **documentações técnicas** e lista de materiais encaminhada nesta proposta

3.2 o material relacionado, possui **garantia de 5 anos**

3.3 o projeto acima proposto, tem **direitos autorais**, sendo vedada a execução do mesmo por terceiros
```

**Resultado no PDF:**
- "documentações técnicas" aparecerá em **negrito**
- "garantia de 5 anos" aparecerá em **negrito**
- "direitos autorais" aparecerá em **negrito**

#### Exemplo 2: Múltiplos destaques na mesma linha
```
3.4 A **garantia do serviço** se dará na **mesma quantidade** da garantia do material.
```

**Resultado no PDF:**
- "garantia do serviço" em **negrito**
- "mesma quantidade" em **negrito**
- Resto do texto normal

#### Exemplo 3: Parágrafo complexo
```
3.5 Quaisquer divergências entre o ofertado e suas **reais necessidades**, poderão ser ajustadas mediante **novo contrato**, para tal, reservamo-nos o direito de **rever os preços** e prazos de entrega.
```

---

## 📝 Onde Editar

### 1. **AutomacaoPdf (Criar Nova Proposta)**
- Campo: "3. Notas Técnicas (Opcional - Item 3 do PDF)"
- Dica exibida: "💡 Use **texto** para formatar em negrito"

### 2. **Propostas (Editar Proposta Existente)**
- Campo: "Notas Técnicas (Item 3 do PDF)"
- Dica exibida: "💡 Use **texto** para deixar em negrito"

---

## ⚙️ Implementação Técnica

### Função de Renderização
Nova função `addFormattedTextWithPageBreaks()` criada em:
- `src/pages/AutomacaoPdf.tsx`
- `src/pages/Propostas.tsx`

### Funcionalidades
- ✅ Parser de markdown inline (`**texto**`)
- ✅ Quebra automática de linha
- ✅ Quebra automática de página
- ✅ Preserva espaçamento entre palavras
- ✅ Suporta múltiplos trechos em negrito na mesma linha
- ✅ Retrocompatível (texto sem marcadores funciona normalmente)

### Exemplo de Processamento
```typescript
Input:  "Este é **negrito** e normal"
Output: 
  - "Este é " (normal)
  - "negrito" (bold)
  - " e normal" (normal)
```

---

## 🎯 Casos de Uso

### Destacar Informações Importantes
```
3.1 A proposta é baseada nas **especificações técnicas fornecidas pelo cliente**
```

### Enfatizar Prazos e Valores
```
3.2 Material com **garantia de 5 anos** contra defeitos de fabricação
```

### Chamar Atenção para Restrições
```
3.3 Projeto possui **direitos autorais protegidos por lei**
```

### Combinar Formatações
```
3.4 Prazo de **entrega: 10 dias úteis** após **aprovação do projeto**
```

---

## ⚠️ Observações

1. **Sempre feche o negrito:** Use `**` no início E no final
   - ✅ Correto: `**texto em negrito**`
   - ❌ Errado: `**texto em negrito`

2. **Sem espaços extras:** Não coloque espaços entre os asteriscos e o texto
   - ✅ Correto: `**negrito**`
   - ❌ Errado: `** negrito **`

3. **Compatibilidade:** Se deixar o campo vazio, o texto padrão será usado automaticamente

4. **Quebra de linha:** Use quebras de linha normais (Enter), não precisa de marcação especial

---

## 📊 Status da Feature

- ✅ Parser implementado
- ✅ Renderização no PDF funcionando
- ✅ Suporte em AutomacaoPdf
- ✅ Suporte em Propostas (edição)
- ✅ Documentação nos formulários
- ✅ Build testado e aprovado
- ✅ Retrocompatível com propostas antigas

**Build Size:** 1,697.76 kB (+ 1.22 kB pela feature)
