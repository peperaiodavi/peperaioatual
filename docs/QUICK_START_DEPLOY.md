# ⚡ Guia Rápido - Configuração e Deploy pepIA

## 🎯 Setup em 5 Minutos

### 1️⃣ Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2️⃣ Configurar Variáveis de Ambiente
```bash
firebase functions:config:set supabase.url="https://seu-projeto.supabase.co"
firebase functions:config:set supabase.key="eyJhbGci..."
firebase functions:config:set openai.key="sk-proj-..."
```

### 3️⃣ Instalar Dependências
```bash
cd functions
npm install
cd ..
npm install
```

### 4️⃣ Deploy Automático
```bash
.\deploy-firebase.ps1
```

---

## 📋 Checklist Pré-Deploy

- [ ] Firebase CLI instalado (`firebase --version`)
- [ ] Logado no Firebase (`firebase login`)
- [ ] Variáveis configuradas (`firebase functions:config:get`)
- [ ] Tabela `templates_escopo` criada no Supabase
- [ ] Arquivo `build/` gerado (`npm run build`)
- [ ] Dependencies instaladas em `functions/`

---

## 🚀 Comandos de Deploy

### Deploy Completo (Recomendado)
```bash
.\deploy-firebase.ps1
```

### Deploy Apenas Backend
```bash
.\deploy-firebase.ps1 -OnlyFunctions
```

### Deploy Apenas Frontend
```bash
.\deploy-firebase.ps1 -OnlyHosting
```

### Deploy sem Rebuild
```bash
.\deploy-firebase.ps1 -SkipBuild
```

---

## 🔧 Configurações Importantes

### 1. Atualizar URLs no Frontend

**Opção A: Variável de Ambiente (Recomendado)**

Crie `.env.production`:
```env
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia
```

**Opção B: Hardcoded**

Edite `src/components/PepIAChat.tsx` e `src/components/PepIAAutomacaoPDF.tsx`:
```typescript
const FUNCTIONS_URL = 'https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia';
const response = await fetch(`${FUNCTIONS_URL}/api/pepia`, {
```

### 2. Configurar CORS (se necessário)

Edite `functions/index.js`:
```javascript
const cors = require('cors')({
  origin: [
    'https://seu-projeto.web.app',
    'https://seu-projeto.firebaseapp.com'
  ]
});
app.use(cors);
```

---

## 🗄️ Banco de Dados (Supabase)

### Executar SQL Obrigatório

Execute no Supabase SQL Editor:
```sql
-- Criar tabela templates_escopo
-- Arquivo: database/create_templates_escopo.sql
```

Copie e execute o conteúdo do arquivo `database/create_templates_escopo.sql`.

---

## 🧪 Testar Depois do Deploy

### 1. Testar Functions
```bash
curl -X POST https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia/api/pepia \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","messages":[{"role":"user","content":"Olá pepIA"}]}'
```

### 2. Testar Frontend
Abra no navegador:
```
https://SEU-PROJETO.web.app
```

### 3. Ver Logs
```bash
firebase functions:log
```

---

## ❌ Solução de Problemas Comuns

### Erro: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Erro: "Not logged in"
```bash
firebase login
```

### Erro: "Environment variables not set"
```bash
firebase functions:config:set supabase.url="URL"
firebase functions:config:set supabase.key="KEY"  
firebase functions:config:set openai.key="KEY"
firebase deploy --only functions
```

### Erro: "CORS policy"
Adicione seu domínio no `functions/index.js`:
```javascript
const cors = require('cors')({ origin: 'https://seu-dominio.web.app' });
```

### Erro: "Build folder not found"
```bash
npm run build
```

### Erro: "Function deployment failed"
```bash
cd functions
npm install
cd ..
firebase deploy --only functions --debug
```

---

## 📊 Monitoramento

### Firebase Console
https://console.firebase.google.com

- **Functions**: Ver execuções, logs, erros
- **Hosting**: Gerenciar deploys, domínios
- **Performance**: Monitorar tempos de resposta

### Ver Logs em Tempo Real
```bash
firebase functions:log --follow
```

### Ver Logs Específicos
```bash
firebase functions:log --only pepia
```

---

## 🔄 Atualizar Sistema

### Atualizar Apenas Backend
```bash
.\deploy-firebase.ps1 -OnlyFunctions
```

### Atualizar Apenas Frontend
```bash
npm run build
.\deploy-firebase.ps1 -OnlyHosting
```

### Atualizar Tudo
```bash
.\deploy-firebase.ps1
```

---

## 💡 Dicas

1. **Sempre teste localmente antes**: `npm run dev` e `firebase emulators:start`
2. **Use variáveis de ambiente**: Nunca commite chaves de API
3. **Monitore os logs**: `firebase functions:log` após deploy
4. **Verifique custos**: Firebase Console > Usage and Billing
5. **Documente mudanças**: Mantenha changelog atualizado

---

## 📞 Suporte

- Documentação Firebase: https://firebase.google.com/docs
- Documentação Supabase: https://supabase.com/docs
- Documentação OpenAI: https://platform.openai.com/docs
- Logs do sistema: `firebase functions:log`

---

## ✅ Deploy Completo Checklist

Depois do deploy, verifique:

- [ ] Site acessível (https://SEU-PROJETO.web.app)
- [ ] Chat pepIA funcionando
- [ ] Automação PDF gerando escopos
- [ ] Templates sendo salvos e listados
- [ ] Análise de Obras calculando corretamente
- [ ] Logs sem erros críticos (`firebase functions:log`)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados com tabelas necessárias

---

🎉 **Sistema pepIA pronto para produção!**

Para suporte, consulte `docs/GUIA_DEPLOY_FIREBASE.md` para instruções detalhadas.
