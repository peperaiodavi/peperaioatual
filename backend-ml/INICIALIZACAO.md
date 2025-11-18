# ============================================
# GUIA DE INICIALIZAÇÃO RÁPIDA - Backend ML
# ============================================

## 🚀 PASSO 1: Instalar Python
Certifique-se de ter Python 3.8+ instalado:
```powershell
python --version
```

Se não tiver Python instalado, baixe em: https://www.python.org/downloads/

---

## 📦 PASSO 2: Criar e Ativar Ambiente Virtual

```powershell
# Navegar até o diretório backend-ml
cd "c:\dev\Peperaio Cvisual\backend-ml"

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Se houver erro de execução de scripts, execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Você saberá que está no ambiente virtual quando ver `(venv)` no início do prompt.**

---

## 📚 PASSO 3: Instalar Dependências

Com o ambiente virtual ativado:

```powershell
pip install -r requirements.txt
```

Isso instalará:
- Flask (API web)
- Flask-CORS (permitir requisições do frontend)
- Pandas (manipulação de dados)
- NumPy (cálculos numéricos)
- Scikit-learn (Machine Learning)
- Joblib (persistência de modelos)

---

## ▶️ PASSO 4: Iniciar o Servidor

```powershell
python app.py
```

**Saída esperada:**
```
 * Running on http://127.0.0.1:5000
 * Running on http://[sua-ip]:5000
```

Deixe este terminal aberto! O servidor precisa ficar rodando.

---

## ✅ PASSO 5: Testar a API

### Abra um NOVO terminal PowerShell e execute:

**Health Check:**
```powershell
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

## 🌐 PASSO 6: Iniciar Frontend React

Com a API rodando, inicie seu frontend React:

```powershell
# Em outro terminal, na raiz do projeto
cd "c:\dev\Peperaio Cvisual"
npm run dev
```

---

## 📊 PASSO 7: Acessar Dashboard de IA

1. Abra o navegador em `http://localhost:5173` (ou a porta do seu Vite)
2. Navegue até `/inteligencia-financeira`
3. O dashboard deve carregar automaticamente os dados via API ML

---

## 🐛 Troubleshooting

### Erro: "python não é reconhecido como comando"
**Solução:** Instale Python e adicione ao PATH do sistema.

### Erro: "pip não é reconhecido como comando"
**Solução:** Use `python -m pip install -r requirements.txt`

### Erro: "Cannot activate virtual environment"
**Solução:** Execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Address already in use" (porta 5000 ocupada)
**Solução:** No arquivo `app.py`, linha final, mude para outra porta:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

E no arquivo `src/services/mlApiService.ts`, atualize:
```typescript
const ML_API_URL = 'http://localhost:5001';
```

### Frontend mostra "API ML offline"
**Soluções:**
1. Certifique-se de que `python app.py` está rodando
2. Verifique se a porta 5000 está acessível
3. Teste o health check: `Invoke-RestMethod -Uri http://localhost:5000/health -Method GET`
4. Verifique o console do navegador para erros de CORS

---

## 📝 Comandos Úteis

```powershell
# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Desativar ambiente virtual
deactivate

# Atualizar dependências
pip install --upgrade -r requirements.txt

# Ver dependências instaladas
pip list

# Reiniciar servidor (após mudanças no código)
# Ctrl+C para parar, depois:
python app.py
```

---

## 🔄 Workflow Diário

1. **Abrir terminal 1:**
   ```powershell
   cd "c:\dev\Peperaio Cvisual\backend-ml"
   .\venv\Scripts\Activate.ps1
   python app.py
   ```

2. **Abrir terminal 2:**
   ```powershell
   cd "c:\dev\Peperaio Cvisual"
   npm run dev
   ```

3. **Acessar:** `http://localhost:5173/inteligencia-financeira`

---

## 📈 Próximos Passos (Opcional)

### Adicionar mais modelos ML:
- Prophet para séries temporais
- ARIMA/SARIMA para previsões sazonais
- Isolation Forest para detecção de anomalias avançada
- XGBoost/LightGBM para previsões mais precisas

### Persistência de modelos:
```python
import joblib

# Salvar modelo treinado
joblib.dump(modelo, 'modelo_treinado.pkl')

# Carregar modelo
modelo = joblib.load('modelo_treinado.pkl')
```

### Cache com Redis:
```powershell
pip install redis
```

---

## 📚 Documentação

- **Flask:** https://flask.palletsprojects.com/
- **Pandas:** https://pandas.pydata.org/docs/
- **Scikit-learn:** https://scikit-learn.org/stable/
- **NumPy:** https://numpy.org/doc/

---

## 🎉 Sucesso!

Se você chegou até aqui e tudo funcionou, seu sistema de **Inteligência Financeira com Machine Learning** está rodando! 🚀

Dashboard exibirá:
- ✅ Padrões por categoria (análise com Pandas)
- ✅ Insights inteligentes (detecção de anomalias com Z-score)
- ✅ Previsão de fluxo de caixa (Random Forest)
- ✅ Score de saúde financeira (0-100)
- ✅ Recomendações personalizadas
- ✅ Análise de comportamento
