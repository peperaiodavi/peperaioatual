# ✅ SCRIPT FINAL - Execute Agora!

## 📋 Seu Setup Atual
- ✅ Tabela: **usuarios** (não profiles)
- ✅ Coluna: **permissao** (admin/visualizador)
- ✅ 2 admins: Marcos Peperaio, davi
- ✅ 1 visualizador: Isaac

---

## 🚀 PASSO 1: Execute Este SQL no Supabase

**Vá para:** Supabase Dashboard → SQL Editor → New Query

**Cole e Execute:**

```sql
-- ==========================================================
-- 🔧 FIX COMPLETO: RLS para Obras + Usuarios
-- ==========================================================

-- PARTE 1: RLS PARA TABELA OBRAS
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin vê todas as obras" ON public.obras;
DROP POLICY IF EXISTS "Visualizador vê obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode criar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode atualizar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode deletar obras" ON public.obras;

CREATE POLICY "Admin vê todas as obras"
  ON public.obras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Visualizador vê obras"
  ON public.obras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'visualizador'
    )
  );

CREATE POLICY "Admin pode criar obras"
  ON public.obras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Admin pode atualizar obras"
  ON public.obras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Admin pode deletar obras"
  ON public.obras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

-- PARTE 2: RLS PARA TABELA USUARIOS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin pode atualizar qualquer perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir INSERT de novos perfis" ON public.usuarios;

CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin vê todos os perfis"
  ON public.usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.usuarios FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin pode atualizar qualquer perfil"
  ON public.usuarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Permitir INSERT de novos perfis"
  ON public.usuarios FOR INSERT
  WITH CHECK (auth.uid() = id);

-- VERIFICAÇÃO
SELECT '✅ Políticas RLS configuradas!' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('obras', 'usuarios');
```

---

## 🎯 PASSO 2: Verifique os Resultados

Você deve ver:
```
✅ Políticas RLS configuradas!

policyname                          | cmd
------------------------------------|--------
Admin vê todas as obras             | SELECT
Visualizador vê obras               | SELECT
Admin pode criar obras              | INSERT
Admin pode atualizar obras          | UPDATE
Admin pode deletar obras            | DELETE
Usuários podem ver próprio perfil   | SELECT
Admin vê todos os perfis            | SELECT
... (mais 3 políticas)
```

---

## 🔄 PASSO 3: Recarregue o Sistema

1. **Faça LOGOUT** do sistema
2. **Faça LOGIN** novamente (como admin)
3. **Recarregue** a página (F5)
4. Vá para **Cards de Obra**
5. Clique em **"Vincular Obra Existente"**

---

## 👀 PASSO 4: Verifique o Console

Pressione **F12** e veja:
```
🔍 Carregando obras disponíveis...
✅ X obras encontradas: [...]

👥 Carregando funcionários...
✅ 1 funcionários encontrados: [{nome: "Isaac", email: "isaacpeperaio@gmail.com", ...}]
```

---

## ✅ Resultado Esperado

**Modal "Vincular Obra Existente":**

```
┌────────────────────────────────────┐
│ Obra Cadastrada *                  │
│ [Dropdown com suas obras]          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Funcionário *                      │
│ [Isaac (isaacpeperaio@gmail.com)]  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Verba Inicial (Opcional)           │
│ [Digite o valor]                   │
└────────────────────────────────────┘

       [Cancelar]  [Vincular Obra]
```

---

## 🐛 Se Ainda Não Funcionar

Execute este diagnóstico:

```sql
-- DIAGNÓSTICO RÁPIDO
SELECT 'Usuário atual:' as tipo, email, permissao FROM public.usuarios WHERE id = auth.uid();
SELECT 'Obras disponíveis:' as tipo, COUNT(*)::text as total FROM public.obras WHERE finalizada = false;
SELECT 'Visualizadores:' as tipo, COUNT(*)::text as total FROM public.usuarios WHERE permissao = 'visualizador';
SELECT 'Políticas obras:' as tipo, COUNT(*)::text as total FROM pg_policies WHERE tablename = 'obras';
SELECT 'Políticas usuarios:' as tipo, COUNT(*)::text as total FROM pg_policies WHERE tablename = 'usuarios';
```

Me envie o resultado!

---

**✅ Após executar o SQL, está tudo pronto para funcionar!**
