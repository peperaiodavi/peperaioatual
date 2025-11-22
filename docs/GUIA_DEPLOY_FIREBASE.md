# 🚀 Guia Completo: Deploy pepIA no Firebase

## 📋 Pré-requisitos

1. **Node.js** instalado (v16 ou superior)
2. **Firebase CLI** instalado globalmente
3. **Conta Google** com acesso ao Firebase Console
4. **Chaves de API**:
   - OpenAI API Key
   - Supabase URL e Service Key

---

## 🔧 Passo 1: Instalar Firebase CLI

```bash
# Instalar Firebase Tools globalmente
npm install -g firebase-tools

# Verificar instalação
firebase --version

# Fazer login no Firebase
firebase login
```

---

## 🎯 Passo 2: Inicializar Projeto Firebase

```bash
# No diretório do projeto
cd C:\dev\Peperaio Cvisual

# Inicializar Firebase (se ainda não foi feito)
firebase init

# Selecione:
# - Functions: Configure Firebase Functions
# - Hosting: Configure hosting
# - Use existing project ou create new project
# - Linguagem: JavaScript
# - ESLint: Yes
# - Instalar dependências: Yes
```

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Configurar no Firebase Functions

```bash
# Configurar Supabase URL
firebase functions:config:set supabase.url="SUA_SUPABASE_URL"

# Configurar Supabase Service Key
firebase functions:config:set supabase.key="SUA_SUPABASE_SERVICE_KEY"

# Configurar OpenAI API Key
firebase functions:config:set openai.key="SUA_OPENAI_KEY"

# Verificar configurações
firebase functions:config:get
```

### 3.2 Exemplo de Configuração

```json
{
  "supabase": {
    "url": "https://seu-projeto.supabase.co",
    "key": "eyJhbGciOi..."
  },
  "openai": {
    "key": "sk-proj-..."
  }
}
```

---

## 📦 Passo 4: Preparar Dependências do Backend

### 4.1 Atualizar package.json das Functions

```bash
cd functions
```

Edite `functions/package.json`:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase - pepIA",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-functions": "^4.5.0",
    "firebase-admin": "^11.11.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-fetch": "^2.7.0",
    "@supabase/supabase-js": "^2.38.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "eslint": "^8.15.0",
    "eslint-config-google": "^0.14.0",
    "firebase-functions-test": "^3.1.0"
  },
  "private": true,
  "scripts": {
    "lint": "eslint .",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  }
}
```

### 4.2 Instalar Dependências

```bash
npm install
cd ..
```

---

## 📂 Passo 5: Copiar Arquivos do Backend

### 5.1 Copiar pepia-rag-service.js

```bash
# Copiar para functions/
copy pepia-rag-service.js functions\pepia-rag-service.js
```

### 5.2 Atualizar functions/index.js

O arquivo `functions/index.js` deve exportar as funções pepIA. Já está criado com a estrutura necessária.

---

## 🌐 Passo 6: Atualizar URLs no Frontend

### 6.1 Encontrar URL da Function

Após deploy, você receberá uma URL como:
```
https://us-central1-seu-projeto.cloudfunctions.net/pepia
```

### 6.2 Atualizar Componentes React

Edite os seguintes arquivos para usar a URL do Firebase:

**src/components/PepIAChat.tsx**:
```typescript
// ANTES:
const response = await fetch('http://localhost:3001/api/pepia', {

// DEPOIS:
const response = await fetch('https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia/api/pepia', {
```

**src/components/PepIAAutomacaoPDF.tsx**:
```typescript
// ANTES:
const response = await fetch('http://localhost:3001/api/pepia/gerar-escopo', {

// DEPOIS:
const response = await fetch('https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia/api/pepia/gerar-escopo', {
```

### 6.3 Criar Variável de Ambiente

Crie `.env.production`:

```env
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia
```

Atualize o código para usar:
```typescript
const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'http://localhost:3001';
const response = await fetch(`${FUNCTIONS_URL}/api/pepia`, {
```

---

## 🏗️ Passo 7: Build do Frontend

```bash
# No diretório raiz
npm run build

# Verificar que a pasta build/ foi criada
dir build
```

---

## 🚀 Passo 8: Deploy Completo

### 8.1 Deploy das Functions

```bash
# Deploy apenas das functions (para testar)
firebase deploy --only functions

# Aguarde... pode levar alguns minutos
# Anote a URL retornada
```

### 8.2 Deploy do Hosting

```bash
# Deploy do frontend
firebase deploy --only hosting
```

### 8.3 Deploy Completo (Functions + Hosting)

```bash
# Deploy de tudo de uma vez
firebase deploy

# Ou usar alias específico
firebase deploy --project seu-projeto-id
```

---

## ✅ Passo 9: Verificar Deploy

### 9.1 Testar Functions

```bash
# Abrir URL da function
https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia/api/pepia

# Testar com curl
curl -X POST https://us-central1-SEU-PROJETO.cloudfunctions.net/pepia/api/pepia \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","messages":[{"role":"user","content":"Olá"}]}'
```

### 9.2 Testar Hosting

```bash
# Abrir no navegador
https://SEU-PROJETO.web.app
```

### 9.3 Verificar Logs

```bash
# Ver logs em tempo real
firebase functions:log

# Ver logs específicos
firebase functions:log --only pepia
```

---

## 🔄 Passo 10: Automatizar Deploy

### 10.1 Criar Script de Deploy

Crie `deploy.ps1`:

```powershell
# Deploy completo do pepIA
Write-Host "🚀 Iniciando deploy do pepIA..." -ForegroundColor Cyan

# 1. Build do frontend
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
npm run build

# 2. Deploy functions
Write-Host "`n☁️ Deploying Firebase Functions..." -ForegroundColor Yellow
firebase deploy --only functions

# 3. Deploy hosting
Write-Host "`n🌐 Deploying Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "`n✅ Deploy completo!" -ForegroundColor Green
Write-Host "Acesse: https://SEU-PROJETO.web.app" -ForegroundColor Cyan
```

### 10.2 Executar Deploy

```bash
.\deploy.ps1
```

---

## 🛠️ Troubleshooting

### Problema: "Function deployment failed"

**Solução**:
```bash
# Verificar logs de erro
firebase functions:log

# Re-deploy com mais detalhes
firebase deploy --only functions --debug
```

### Problema: "CORS error"

**Solução**: Adicionar domínio no Firebase Functions:
```javascript
// functions/index.js
const cors = require('cors')({
  origin: [
    'https://seu-projeto.web.app',
    'https://seu-projeto.firebaseapp.com',
    'http://localhost:5173' // desenvolvimento
  ]
});
```

### Problema: "Environment variables not set"

**Solução**:
```bash
# Re-configurar variáveis
firebase functions:config:set supabase.url="URL"
firebase functions:config:set supabase.key="KEY"
firebase functions:config:set openai.key="KEY"

# Re-deploy
firebase deploy --only functions
```

### Problema: "Build folder not found"

**Solução**:
```bash
# Garantir que build existe
npm run build

# Verificar firebase.json apontando para "build"
# "hosting": { "public": "build" }
```

---

## 📊 Monitoramento

### Firebase Console

1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. **Functions**: Ver execuções, logs, performance
4. **Hosting**: Ver tráfego, deploys anteriores
5. **Performance**: Monitorar tempos de resposta

### Comandos Úteis

```bash
# Ver status do projeto
firebase projects:list

# Ver informações do projeto atual
firebase use

# Ver deploys anteriores
firebase hosting:channel:list

# Rollback para versão anterior
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## 💰 Custos Estimados

### Firebase (Plano Spark - Gratuito)
- **Functions**: 125K invocações/mês, 40K GB-s/mês
- **Hosting**: 10 GB armazenamento, 360 MB/dia transferência

### Upgrade para Blaze (Pay-as-you-go)
Necessário se exceder limites gratuitos:
- **Functions**: $0.40 por milhão de invocações
- **Hosting**: $0.026 por GB transferência

### OpenAI API
- **GPT-3.5-turbo**: ~$0.002 por 1K tokens
- **Embeddings**: ~$0.0001 por 1K tokens
- **Estimativa**: ~$5-20/mês para uso moderado

---

## 🎯 Checklist Final

Antes de considerar deploy completo:

- [ ] Firebase CLI instalado e logado
- [ ] Variáveis de ambiente configuradas (Supabase + OpenAI)
- [ ] Dependencies instaladas (functions/node_modules)
- [ ] Frontend buildado (pasta build/ existe)
- [ ] URLs atualizadas no código (FUNCTIONS_URL)
- [ ] Functions deployed com sucesso
- [ ] Hosting deployed com sucesso
- [ ] Teste end-to-end (chat funcionando)
- [ ] Logs sem erros críticos
- [ ] Tabela templates_escopo criada no Supabase

---

## 📞 Suporte

Em caso de dúvidas:
1. Verificar logs: `firebase functions:log`
2. Consultar documentação: https://firebase.google.com/docs
3. Revisar código em `functions/index.js`

---

🎉 **Seu sistema pepIA está pronto para produção!**
