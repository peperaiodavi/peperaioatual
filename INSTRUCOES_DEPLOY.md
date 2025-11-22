# ⚡ INSTRUÇÕES RÁPIDAS - Deploy pepIA em 3 Passos

## 🎯 Antes de Começar

Você precisa ter:
- ✅ Node.js instalado
- ✅ Conta Google
- ✅ Chaves: Supabase URL/Key + OpenAI Key

---

## 📝 PASSO 1: Configurar Firebase (Uma vez só)

### 1.1 Instalar Firebase CLI
Abra PowerShell como Administrador:
```powershell
npm install -g firebase-tools
```

### 1.2 Fazer Login
```powershell
firebase login
```
→ Abrirá navegador, faça login com Google

### 1.3 Configurar Chaves
```powershell
firebase functions:config:set supabase.url="SUA_URL_AQUI"
firebase functions:config:set supabase.key="SUA_CHAVE_AQUI"
firebase functions:config:set openai.key="SUA_CHAVE_OPENAI"
```

**Onde pegar as chaves:**
- **Supabase**: https://app.supabase.com → Settings → API
- **OpenAI**: https://platform.openai.com → API Keys

### 1.4 Instalar Dependências
```powershell
cd functions
npm install
cd ..
```

---

## 🚀 PASSO 2: Deploy (Sempre que atualizar)

### Opção A: Script Automático (Recomendado)
```powershell
.\deploy-firebase.ps1
```
→ Faz tudo automaticamente (build + deploy)

### Opção B: Manual
```powershell
# Build frontend
npm run build

# Deploy tudo
firebase deploy
```

---

## 🔗 PASSO 3: Atualizar URLs (Apenas primeira vez)

### 3.1 Pegar URL do Firebase
Após deploy, copie a URL que aparecer:
```
Functions URL: https://us-central1-XXXXX.cloudfunctions.net/pepia
Hosting URL: https://XXXXX.web.app
```

### 3.2 Criar Arquivo de Configuração
Crie o arquivo `.env.production` na raiz do projeto:
```env
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-XXXXX.cloudfunctions.net/pepia
```

### 3.3 Re-deploy Frontend
```powershell
npm run build
firebase deploy --only hosting
```

---

## ✅ PRONTO! Sistema no Ar

Acesse:
```
https://SEU-PROJETO.web.app
```

### Testar:
1. Fazer login
2. Ir em pepIA → Chat
3. Perguntar algo
4. Se funcionar = SUCESSO! 🎉

---

## 🔧 Se Der Erro

### Erro: "Firebase CLI not found"
```powershell
npm install -g firebase-tools
```

### Erro: "Not logged in"
```powershell
firebase login
```

### Erro: "Variables not set"
```powershell
firebase functions:config:get
```
→ Se vazio, volte ao Passo 1.3

### Ver logs de erro:
```powershell
firebase functions:log
```

---

## 📱 Comandos Úteis

```powershell
# Ver se está logado
firebase projects:list

# Re-deploy apenas backend
firebase deploy --only functions

# Re-deploy apenas frontend
npm run build
firebase deploy --only hosting

# Ver logs em tempo real
firebase functions:log --follow

# Abrir console Firebase
start https://console.firebase.google.com
```

---

## 💡 Dicas

1. **Sempre faça build antes de deploy:**
   ```powershell
   npm run build
   ```

2. **Use o script automático para economizar tempo:**
   ```powershell
   .\deploy-firebase.ps1
   ```

3. **Monitore os logs após deploy:**
   ```powershell
   firebase functions:log
   ```

4. **Guarde suas chaves de API em local seguro**

---

## 📚 Mais Informações

- **Guia Completo**: Abra `docs/GUIA_DEPLOY_FIREBASE.md`
- **Resumo Final**: Abra `docs/RESUMO_IMPLEMENTACAO_FINAL.md`
- **Troubleshooting**: Abra `docs/QUICK_START_DEPLOY.md`

---

## 🆘 Precisa de Ajuda?

1. Leia `docs/GUIA_DEPLOY_FIREBASE.md` (passo a passo detalhado)
2. Verifique logs: `firebase functions:log`
3. Consulte Firebase Console: https://console.firebase.google.com

---

🎉 **Sistema pepIA pronto para produção!**

**Lembre-se:** Configuração (Passo 1) é feita UMA VEZ só. Deploy (Passo 2) é feito sempre que atualizar o sistema.
