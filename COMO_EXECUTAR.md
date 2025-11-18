# 🚀 COMO EXECUTAR O SISTEMA DE IA FINANCEIRA

## ⚡ Início Rápido (2 Terminais)

### Terminal 1: Backend Python ML

```powershell
cd "c:\dev\Peperaio Cvisual\backend-ml"
.\iniciar.ps1
```

**Ou manualmente:**
```powershell
cd "c:\dev\Peperaio Cvisual\backend-ml"
.\venv\Scripts\Activate.ps1
python app.py
```

### Terminal 2: Frontend React

```powershell
cd "c:\dev\Peperaio Cvisual"
npm run dev
```

### ✅ Acessar

Abra o navegador em: `http://localhost:5173/inteligencia-financeira`

---

## 📋 Checklist de Verificação

- [ ] Python 3.8+ instalado
- [ ] Node.js e npm instalados
- [ ] Backend rodando na porta 5000
- [ ] Frontend rodando na porta 5173
- [ ] Navegador exibindo dashboard sem erros

---

## 🧪 Testar Backend Separadamente

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:5000/health -Method GET
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Financial AI API is running"
}
```

---

## 🛠️ Solução de Problemas

### Backend não inicia

```powershell
# Recriar ambiente virtual
cd "c:\dev\Peperaio Cvisual\backend-ml"
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### Frontend não conecta

1. Verifique se backend está rodando: `http://localhost:5000/health`
2. Verifique o console do navegador (F12)
3. Confirme que `mlApiService.ts` usa `http://localhost:5000`

### Porta 5000 ocupada

No arquivo `backend-ml/app.py`, linha final:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

E em `src/services/mlApiService.ts`:
```typescript
const ML_API_URL = 'http://localhost:5001';
```

---

## 📂 Estrutura do Sistema

```
Backend Python (Porta 5000)
  ├── Flask API
  ├── Pandas (processamento de dados)
  ├── Scikit-learn (Machine Learning)
  └── Algoritmos:
      ├── Linear Regression (tendências)
      ├── Random Forest (previsões)
      └── Z-Score (anomalias)

Frontend React (Porta 5173)
  ├── useFinancialAI.ts (hook)
  ├── mlApiService.ts (cliente API)
  └── InteligenciaFinanceira.tsx (dashboard)

Banco de Dados
  └── Supabase (PostgreSQL)
```

---

## 📊 O que o Sistema Faz

1. **Carrega dados do Supabase** (transações + gastos de obras)
2. **Envia para Python ML** via POST /api/analyze
3. **Pandas processa** os dados em DataFrames
4. **Scikit-learn aplica** algoritmos ML:
   - Linear Regression → detecta tendências
   - Random Forest → prevê próximos meses
   - Z-Score → identifica anomalias
5. **Retorna JSON** com insights, padrões, previsões
6. **Dashboard exibe** visualizações interativas

---

## 🎯 Resultado Final

Dashboard com:
- ✅ Score de saúde financeira (0-100)
- ✅ 8+ insights inteligentes com ícones
- ✅ Padrões por categoria (tendências + previsões)
- ✅ Gráfico de fluxo de caixa (6 meses)
- ✅ Análise de comportamento
- ✅ 6 recomendações personalizadas

---

## 📚 Documentação Completa

- **API Backend:** `backend-ml/README.md`
- **Setup Detalhado:** `backend-ml/INICIALIZACAO.md`
- **Arquitetura ML:** `docs/SISTEMA_ML_FINANCEIRO.md`

---

## 💡 Dica Pro

Crie um atalho para executar tudo de uma vez:

**executar-tudo.ps1:**
```powershell
# Terminal 1: Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\dev\Peperaio Cvisual\backend-ml'; .\iniciar.ps1"

# Aguardar 5 segundos
Start-Sleep -Seconds 5

# Terminal 2: Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\dev\Peperaio Cvisual'; npm run dev"

# Aguardar 10 segundos e abrir navegador
Start-Sleep -Seconds 10
Start-Process "http://localhost:5173/inteligencia-financeira"
```

Depois execute:
```powershell
.\executar-tudo.ps1
```

---

## 🎉 Sucesso!

Se você consegue ver o dashboard com dados e sem erros no console, o sistema está funcionando perfeitamente! 🚀

**Machine Learning + Pandas + React = Inteligência Financeira Profissional** ✨
