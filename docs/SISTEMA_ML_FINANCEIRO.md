# Sistema de Inteligência Financeira com Machine Learning

## 📚 Visão Geral

Sistema completo de análise financeira usando **Pandas** e **Scikit-learn** para processamento de dados e algoritmos de Machine Learning.

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Frontend React │
│   (TypeScript)  │
└────────┬────────┘
         │
         │ HTTP/JSON
         │
┌────────▼────────┐
│   Flask API     │
│  (Python 3.8+)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Pandas│  │Scikit-│
│      │  │learn  │
└──────┘  └───────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │Supabase │
    │PostgreSQL
    └─────────┘
```

## 🧠 Algoritmos de Machine Learning

### 1. **Linear Regression** (Análise de Tendências)
```python
from sklearn.linear_model import LinearRegression

lr = LinearRegression()
lr.fit(X, y)
tendencia_valor = lr.coef_[0]

if tendencia_valor > media * 0.05:
    tendencia = 'crescente'
elif tendencia_valor < -media * 0.05:
    tendencia = 'decrescente'
else:
    tendencia = 'estavel'
```

**Uso:** Determinar se gastos estão crescendo, estáveis ou decrescendo.

### 2. **Random Forest Regressor** (Previsões)
```python
from sklearn.ensemble import RandomForestRegressor

rf = RandomForestRegressor(n_estimators=50, random_state=42)
rf.fit(X_features, y_target)

# Prever próximo mês
last_3_months = gastos_mensais.iloc[-3:].values.reshape(1, -1)
previsao = rf.predict(last_3_months)[0]
confianca = rf.score(X_features, y_target) * 100
```

**Uso:** Prever gastos do próximo mês com base em janela móvel de 3 meses.

### 3. **Z-Score** (Detecção de Anomalias)
```python
z_scores = np.abs((valores - valores.mean()) / valores.std())
anomalias = transacoes[z_scores > 2]  # 95% confiança
```

**Uso:** Identificar transações anômalas (valores fora do padrão).

### 4. **Clustering de Padrões Sazonais**
```python
gastos_por_mes = df.groupby('mes')['valor'].sum()
meses_alto_gasto = gastos_por_mes[gastos_por_mes > gastos_por_mes.mean() * 1.3]
```

**Uso:** Detectar meses com gastos elevados (padrões sazonais).

## 📊 Features Extraídas (Pandas)

Para cada transação, extraímos:

```python
df['ano'] = df['data'].dt.year
df['mes'] = df['data'].dt.month
df['dia'] = df['data'].dt.day
df['dia_semana'] = df['data'].dt.dayofweek  # 0=Segunda, 6=Domingo
df['dia_mes'] = df['data'].dt.day
df['trimestre'] = df['data'].dt.quarter  # 1-4
df['semana_ano'] = df['data'].dt.isocalendar().week  # 1-52
```

Essas features temporais são fundamentais para treinar modelos de ML.

## 🔍 Análises Realizadas

### 1. Padrões por Categoria
```python
padroes = {
  'categoria': 'Material',
  'mediaGastoMensal': 5000.0,
  'tendencia': 'crescente',  # Linear Regression
  'variacao': 15.3,  # Últimos 3 vs 3 anteriores
  'previsaoProximoMes': 5765.0,  # Random Forest
  'confianca': 82.5,  # Score do modelo
  'desvio_padrao': 450.2
}
```

### 2. Insights Inteligentes
```python
insights = [
  {
    'tipo': 'alerta',
    'titulo': '3 transação(ões) anômala(s) detectada(s)',
    'descricao': 'Valores significativamente acima do padrão',
    'impacto': 'alto',
    'valor': 15000.0,
    'icon': '⚠️',
    'cor': '#ef4444'
  },
  {
    'tipo': 'previsao',
    'titulo': 'Padrão sazonal detectado',
    'descricao': 'Meses com gastos elevados: Jan, Jul, Dez',
    'impacto': 'medio',
    'icon': '📅',
    'cor': '#f59e0b'
  }
]
```

### 3. Previsão de Fluxo de Caixa
```python
previsoes = [
  {
    'mes': 'Jan',
    'previsaoEntrada': 50000.0,
    'previsaoSaida': 35000.0,
    'saldoPrevisto': 15000.0,
    'confianca': 95  # Diminui com o tempo
  },
  # ... próximos 5 meses
]
```

### 4. Score de Saúde Financeira
```python
score = 50  # Base
score += min(25, taxa_liquidez * 100)  # Saldo positivo
score += consistencia_score  # Baixo desvio padrão
score += tendencias_positivas_score  # Categorias estáveis
# Resultado: 0-100
```

## 🔄 Fluxo de Dados

```
1. Frontend carrega dados do Supabase
   ↓
2. Converte para formato ML (mlApiService.ts)
   ↓
3. POST /api/analyze com JSON
   {
     transacoes: [...],
     gastos_obras: [...]
   }
   ↓
4. Python: JSON → Pandas DataFrame
   ↓
5. Extração de features temporais
   ↓
6. Aplicação de algoritmos ML
   - Linear Regression (tendências)
   - Random Forest (previsões)
   - Z-Score (anomalias)
   ↓
7. Geração de insights e recomendações
   ↓
8. JSON Response → Frontend
   ↓
9. Display no Dashboard React
```

## 🛠️ Implementação Técnica

### Backend (Python Flask)

**Classe Principal:**
```python
class FinancialAIAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.models = {}
    
    def prepare_dataframe(self, transacoes, gastos_obras):
        # JSON → Pandas DataFrame
        df_trans = pd.DataFrame(transacoes)
        df_trans['data'] = pd.to_datetime(df_trans['data'])
        df_trans['valor'] = pd.to_numeric(df_trans['valor'])
        return df_trans, df_gastos
    
    def extract_features(self, df):
        # Extração de features temporais
        df['ano'] = df['data'].dt.year
        df['mes'] = df['data'].dt.month
        # ... mais features
        return df
    
    def analyze_patterns_ml(self, df_trans, df_gastos):
        # Análise com Linear Regression e Random Forest
        # ...
    
    def generate_insights_ml(self, df_trans, df_gastos, padroes):
        # Z-Score, clustering, correlações
        # ...
```

### Frontend (TypeScript React)

**Serviço de API:**
```typescript
// src/services/mlApiService.ts
export async function analisarFinancasComML(
  transacoes: TransacaoML[],
  gastos_obras: GastoObraML[]
): Promise<ResultadoAnaliseML> {
  const response = await fetch('http://localhost:5000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacoes, gastos_obras })
  });
  return response.json();
}
```

**Hook Customizado:**
```typescript
// src/hooks/useFinancialAI.ts
export const useFinancialAI = () => {
  const [data, setData] = useState<FinancialAIData>({...});
  
  const loadAndAnalyze = async () => {
    // 1. Verificar se API está online
    const mlDisponivel = await verificarHealthML();
    
    // 2. Carregar dados do Supabase
    const { data: transacoes } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', dataInicio);
    
    // 3. Converter para formato ML
    const transacoesML = converterTransacoesParaML(transacoes);
    
    // 4. Chamar API ML
    const resultado = await analisarFinancasComML(transacoesML, gastosML);
    
    // 5. Atualizar estado
    setData({
      padroesPorCategoria: resultado.padroesPorCategoria,
      insights: resultado.insights,
      // ...
    });
  };
  
  return { data, refresh: loadAndAnalyze };
};
```

## 📈 Comparação: JavaScript vs Python ML

| Aspecto | JavaScript (antes) | Python ML (agora) |
|---------|-------------------|-------------------|
| Análise de tendências | Média manual | Linear Regression |
| Previsões | Média ponderada | Random Forest Regressor |
| Anomalias | Threshold fixo | Z-Score estatístico |
| Padrões sazonais | Não detectado | Clustering por mês |
| Correlações | Não detectado | Análise multivariada |
| Confiança das previsões | Estática | Score do modelo ML |
| Processamento de dados | Loops JavaScript | Pandas (vetorizado) |
| Performance | O(n²) loops | O(n) Pandas/NumPy |

## 🚀 Vantagens do Sistema ML

1. **Precisão:** Modelos treinados em dados reais
2. **Escalabilidade:** Pandas processa milhões de linhas
3. **Detecção avançada:** Z-Score para anomalias estatísticas
4. **Previsões confiáveis:** Random Forest com score de confiança
5. **Padrões complexos:** Clustering detecta sazonalidades
6. **Extensível:** Fácil adicionar novos algoritmos (ARIMA, Prophet, XGBoost)

## 📦 Estrutura de Arquivos

```
Peperaio Cvisual/
│
├── backend-ml/
│   ├── app.py                    # Flask API com algoritmos ML
│   ├── requirements.txt          # Dependências Python
│   ├── iniciar.ps1              # Script de inicialização
│   ├── README.md                # Documentação completa da API
│   ├── README_QUICK.md          # Guia rápido
│   ├── INICIALIZACAO.md         # Setup detalhado
│   └── venv/                    # Ambiente virtual (após setup)
│
├── src/
│   ├── services/
│   │   └── mlApiService.ts      # Cliente da API ML
│   ├── hooks/
│   │   └── useFinancialAI.ts    # Hook React integrado com ML
│   └── pages/
│       └── InteligenciaFinanceira.tsx  # Dashboard
│
└── docs/
    └── SISTEMA_ML_FINANCEIRO.md  # Esta documentação
```

## 🎯 Próximas Melhorias

### 1. Prophet (Facebook)
```python
from prophet import Prophet

model = Prophet()
model.fit(df)
forecast = model.predict(future_df)
```
**Benefício:** Séries temporais com sazonalidade automática.

### 2. ARIMA/SARIMA
```python
from statsmodels.tsa.arima.model import ARIMA

model = ARIMA(data, order=(1, 1, 1))
results = model.fit()
forecast = results.forecast(steps=6)
```
**Benefício:** Previsões estatísticas robustas.

### 3. Isolation Forest
```python
from sklearn.ensemble import IsolationForest

clf = IsolationForest(contamination=0.05)
clf.fit(X)
anomalias = clf.predict(X)
```
**Benefício:** Detecção avançada de anomalias multivariadas.

### 4. XGBoost/LightGBM
```python
import xgboost as xgb

model = xgb.XGBRegressor(n_estimators=100)
model.fit(X_train, y_train)
```
**Benefício:** Previsões mais precisas com gradient boosting.

### 5. Cache com Redis
```python
import redis

cache = redis.Redis(host='localhost', port=6379)
cache.set('analise_123', json.dumps(resultado), ex=3600)
```
**Benefício:** Respostas instantâneas para análises repetidas.

## 🔧 Manutenção

### Atualizar Dependências
```powershell
pip install --upgrade pandas scikit-learn numpy flask
pip freeze > requirements.txt
```

### Adicionar Novo Algoritmo
```python
# Em app.py, dentro da classe FinancialAIAnalyzer

def novo_algoritmo_ml(self, df):
    from sklearn.cluster import KMeans
    
    # Seu código aqui
    kmeans = KMeans(n_clusters=3)
    labels = kmeans.fit_predict(df[['valor']])
    
    return labels
```

### Logging
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info('Análise iniciada')
logger.error('Erro ao processar dados')
```

## 📞 Troubleshooting

### Erro: "CORS policy error"
**Solução:** `Flask-CORS` já está configurado. Verifique se a API está rodando.

### Erro: "numpy.core._multiarray_umath module"
**Solução:** Reinstalar NumPy:
```powershell
pip uninstall numpy
pip install numpy==1.26.2
```

### Performance lenta
**Soluções:**
1. Limitar janela de dados (últimos 6 meses ao invés de 12)
2. Cache com Redis
3. Otimizar queries do Supabase com índices

## 📚 Referências

- **Pandas:** https://pandas.pydata.org/docs/
- **Scikit-learn:** https://scikit-learn.org/stable/
- **Flask:** https://flask.palletsprojects.com/
- **Machine Learning Mastery:** https://machinelearningmastery.com/

## 🎓 Conceitos Utilizados

- **Regressão Linear:** Modelar relação entre variável dependente e independentes
- **Random Forest:** Ensemble de árvores de decisão para previsões robustas
- **Z-Score:** Medir quantos desvios padrão um valor está da média
- **Feature Engineering:** Criar features úteis (ano, mês, dia_semana) de timestamps
- **Time Series:** Análise de dados temporais com janelas móveis
- **Clustering:** Agrupar dados similares (gastos por mês)
- **Score de Confiança:** Avaliar qualidade das previsões do modelo

## ✅ Conclusão

Sistema completo de **Inteligência Artificial Financeira** usando:
- ✅ **Pandas** para manipulação de dados
- ✅ **Scikit-learn** para Machine Learning
- ✅ **Linear Regression** para análise de tendências
- ✅ **Random Forest** para previsões mensais
- ✅ **Z-Score** para detecção de anomalias
- ✅ **Feature Engineering** com timestamps
- ✅ **API REST** com Flask
- ✅ **Integração React/TypeScript**

O sistema agora oferece análises profissionais com algoritmos de ML ao invés de lógica manual JavaScript! 🚀
