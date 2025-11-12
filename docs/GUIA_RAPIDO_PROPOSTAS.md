# 🚀 Guia Rápido - Sistema de Propostas

## ⚡ Configuração Inicial (Uma única vez)

### 1. Criar a tabela no Supabase

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Abra o arquivo `database/create_propostas_table.sql`
6. Copie TODO o conteúdo
7. Cole no editor
8. Clique em **RUN** ou pressione `Ctrl + Enter`
9. Aguarde a mensagem de sucesso ✅

**Pronto!** A tabela está criada.

---

## 📝 Como Usar

### Criar uma Proposta

1. Menu → **Automação PDF**
2. Preencha todos os campos obrigatórios (*)
3. Adicione itens de preço (botão +)
4. Clique em **"Exportar Proposta"**
5. ✅ Proposta salva + PDF baixado

### Ver Propostas Salvas

1. Menu → **Propostas**
2. Veja todas as propostas
3. Use os botões:
   - **PDF** - Baixar PDF novamente
   - **Editar** - Modificar a proposta
   - **Finalizar** - Criar obra
   - **🗑️** - Deletar

### Editar uma Proposta

1. Na página Propostas
2. Clique em **Editar**
3. Modifique o que precisar
4. Use **+** para adicionar itens
5. Use **−** para remover itens
6. Clique em **Salvar Alterações**

### Finalizar e Criar Obra

1. Na página Propostas
2. Clique em **Finalizar**
3. Digite o **nome da obra**
4. Clique em **Criar Obra**
5. ✅ Obra criada!
6. Menu → **Obras** para ver

---

## 🎯 Exemplo Prático

```
CENÁRIO: Nova proposta para o cliente "ENF CLINIC"

1️⃣ Menu > Automação PDF
   - Cliente: "ENF CLINIC"
   - Contato: "Elizeu"
   - Número: "2025 570-R04"
   - Preencher escopo e itens
   - Exportar Proposta ✅

2️⃣ Menu > Propostas
   - Ver a proposta criada
   - Editar se necessário
   - Reexportar PDF se editou

3️⃣ Quando o cliente aprovar:
   - Clicar em "Finalizar"
   - Digite: "Fachada ENF Clinic"
   - Criar Obra ✅

4️⃣ Menu > Obras
   - Ver nova obra criada
   - Orçamento já preenchido
   - Adicionar gastos conforme a obra avança
```

---

## ⚠️ Importante

- ✅ Propostas finalizadas ficam com badge verde
- ✅ Propostas finalizadas NÃO podem ser editadas
- ✅ Você pode deletar qualquer proposta
- ✅ O valor da proposta vira o orçamento da obra
- ✅ Todos os PDFs têm o mesmo padrão profissional

---

## 🐛 Problemas?

**Proposta não salva?**
→ Verifique se criou a tabela no Supabase

**Botão "Editar" desabilitado?**
→ Verifique suas permissões de usuário

**Erro ao criar obra?**
→ Verifique se a tabela `obras` existe no Supabase

**PDF não baixa?**
→ Verifique se preencheu todos os campos obrigatórios (*)

---

**Pronto! Sistema configurado e funcionando** 🎉
