# Backend ML - Sistema de Inteligência Financeira

Este backend Python usa **Pandas** e **Scikit-learn** para análise avançada de dados financeiros com Machine Learning.

## 🚀 Instalação

### 1. Criar ambiente virtual (recomendado)

```powershell
# No diretório backend-ml
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1
```

### 2. Instalar dependências

```powershell
pip install -r requirements.txt
```

## ▶️ Executar API

```powershell
# Certifique-se de estar no ambiente virtual
python app.py
```

O servidor iniciará em: `http://localhost:5000`

## 📡 Endpoints da API

### POST `/api/analyze`
Realiza análise completa dos dados financeiros.

**Request Body:**
```json
{
  "transacoes": [
    {
      "id": 1,
      "data": "2024-01-15",
      "valor": 5000,
      "tipo": "entrada",
      "categoria": "Receita"
    }
  ],
  "gastos_obras": [
    {
      "id": 1,
      "data": "2024-01-20",
      "valor": 2500,
      "categoria": "Material"
    }
  ]
}
```

**Response:**
```json
{
  "padroesPorCategoria": [...],
  "insights": [...],
  "previsaoFluxoCaixa": [...],
  "analiseComportamento": {...},
  "saudeFinanceira": 75,
  "recomendacoes": [...],
  "sucesso": true
}
```

### GET `/health`
Health check do servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Financial AI API is running"
}
```

## 🧠 Algoritmos de ML Utilizados

### 1. **Linear Regression**
- **Uso:** Análise de tendências em categorias de gastos
- **Biblioteca:** `sklearn.linear_model.LinearRegression`

### 2. **Random Forest Regressor**
- **Uso:** Previsão de gastos mensais por categoria
- **Parâmetros:** 50 estimadores, random_state=42
- **Biblioteca:** `sklearn.ensemble.RandomForestRegressor`

### 3. **Z-Score (Detecção de Anomalias)**
- **Uso:** Identificar transações anômalas (valores atípicos)
- **Método:** `(valor - média) / desvio_padrão`
- **Threshold:** Z > 2 (95% confiança)

### 4. **K-Means Clustering**
- **Uso:** Agrupar padrões de comportamento financeiro
- **Biblioteca:** `sklearn.cluster.KMeans`

### 5. **Standard Scaler**
- **Uso:** Normalização de features para ML
- **Biblioteca:** `sklearn.preprocessing.StandardScaler`

## 📊 Features Extraídas do Pandas

Para cada transação, o sistema extrai:
- `ano`, `mes`, `dia`
- `dia_semana` (0-6, onde 0 = Segunda)
- `dia_mes` (1-31)
- `trimestre` (1-4)
- `semana_ano` (1-52)

Essas features são usadas para treinar os modelos de ML.

## 🔍 Análises Realizadas

### 1. **Padrões por Categoria**
- Média de gastos mensais
- Tendência (crescente, decrescente, estável) usando Linear Regression
- Previsão próximo mês usando Random Forest
- Variação percentual (últimos 3 vs 3 anteriores)
- Confiança da previsão

### 2. **Insights Inteligentes**
- Detecção de anomalias (Z-score)
- Padrões sazonais (clustering por mês)
- Correlações entre categorias
- Eficiência financeira (taxa entradas/saídas)
- Previsão de categoria com maior crescimento

### 3. **Previsão de Fluxo de Caixa**
- Usa séries temporais com janela móvel de 3 meses
- Prevê 6 meses futuros
- Entradas e saídas separadas
- Confiança decresce ao longo do tempo (95% → 50%)

### 4. **Análise de Comportamento**
- Dia da semana com mais gastos (usando `groupby` do Pandas)
- Categoria dominante
- Eficiência financeira (score 0-100)
- Padrões sazonais detectados

### 5. **Saúde Financeira (Score 0-100)**
Calcula score baseado em:
- **Liquidez:** (entradas - saídas) / entradas (peso: 25pts)
- **Consistência:** Baixo coeficiente de variação (peso: 15pts)
- **Tendências:** Proporção de categorias estáveis/decrescentes (peso: 10pts)
- **Base:** 50pts

### 6. **Recomendações Personalizadas**
- Baseadas no score de saúde financeira
- Alertas para múltiplas categorias crescendo
- Sugestões de otimização e investimento

## 🛠️ Estrutura do Código

```
backend-ml/
│
├── app.py                    # Flask API e endpoints
├── requirements.txt          # Dependências Python
├── README.md                # Esta documentação
└── venv/                    # Ambiente virtual (após instalação)
```

### Classe Principal: `FinancialAIAnalyzer`

**Métodos:**
- `prepare_dataframe()`: Converte JSON → Pandas DataFrame
- `extract_features()`: Extrai features temporais
- `analyze_patterns_ml()`: Análise de padrões com ML
- `generate_insights_ml()`: Gera insights usando Z-score e clustering
- `predict_cash_flow_ml()`: Previsão de fluxo de caixa
- `calculate_financial_health_ml()`: Calcula score de saúde
- `analyze_behavior()`: Análise de comportamento

## 📦 Integração com Frontend

### 1. Criar serviço TypeScript (`src/services/mlApiService.ts`)
```typescript
const API_URL = 'http://localhost:5000';

export async function analisarFinancas(transacoes: any[], gastos_obras: any[]) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacoes, gastos_obras })
  });
  return response.json();
}
```

### 2. Atualizar hook `useFinancialAI.ts`
Substituir lógica JavaScript por chamadas à API Python.

## 🔄 Fluxo de Dados

```
Frontend (React)
    ↓
Fetch dados do Supabase
    ↓
POST /api/analyze (Python Flask)
    ↓
Pandas + Scikit-learn (ML)
    ↓
JSON Response
    ↓
Display no Dashboard
```

## 🧪 Testar API

### PowerShell (usando Invoke-RestMethod):

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:5000/health -Method GET

# Análise completa
$body = @{
  transacoes = @(
    @{ id=1; data="2024-01-15"; valor=5000; tipo="entrada"; categoria="Receita" }
    @{ id=2; data="2024-01-20"; valor=2500; tipo="saida"; categoria="Material" }
  )
  gastos_obras = @()
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/analyze -Method POST -Body $body -ContentType 'application/json'
```

## 📈 Melhorias Futuras

- **Prophet:** Para séries temporais mais robustas
- **ARIMA/SARIMA:** Modelos estatísticos de séries temporais
- **LightGBM/XGBoost:** Gradient boosting para previsões
- **Isolation Forest:** Detecção de anomalias avançada
- **Cache:** Redis para otimizar respostas repetidas
- **Database:** Persistir modelos treinados com joblib

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'flask'"
**Solução:** Certifique-se de estar no ambiente virtual e instalar dependências.

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Erro: "CORS policy error" no frontend
**Solução:** `flask-cors` já está instalado e configurado em `app.py`.

### Erro: "Port 5000 already in use"
**Solução:** Mude a porta em `app.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

## 📞 Suporte

Este backend foi desenvolvido especificamente para o sistema Peperaio Cvisual usando as melhores práticas de Data Science e Machine Learning.
