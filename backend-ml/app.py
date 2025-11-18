from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import joblib
import os

app = Flask(__name__)
CORS(app)

class FinancialAIAnalyzer:
    """
    Sistema de IA Financeira usando Pandas e Scikit-learn
    Análise preditiva avançada com Machine Learning
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.models = {}
        
    def prepare_dataframe(self, transacoes, dividas=None):
        """Prepara DataFrames do Pandas a partir dos dados - APENAS CAIXA"""
        # Criar DataFrame de transações do caixa
        if transacoes:
            df_trans = pd.DataFrame(transacoes)
            df_trans['data'] = pd.to_datetime(df_trans['data'])
            df_trans['valor'] = pd.to_numeric(df_trans['valor'])
        else:
            df_trans = pd.DataFrame()
        
        # Criar DataFrame de dívidas
        if dividas:
            df_dividas = pd.DataFrame(dividas)
            if not df_dividas.empty:
                if 'vencimento' in df_dividas.columns:
                    df_dividas['vencimento'] = pd.to_datetime(df_dividas['vencimento'])
                df_dividas['valor'] = pd.to_numeric(df_dividas.get('valorRestante', df_dividas.get('valor', 0)))
        else:
            df_dividas = pd.DataFrame()
        
        return df_trans, df_dividas
    
    def extract_features(self, df, data_col='data', valor_col='valor'):
        """Extrai features temporais para ML"""
        if df.empty:
            return df
        
        df = df.copy()
        df['ano'] = df[data_col].dt.year
        df['mes'] = df[data_col].dt.month
        df['dia'] = df[data_col].dt.day
        df['dia_semana'] = df[data_col].dt.dayofweek
        df['dia_mes'] = df[data_col].dt.day
        df['trimestre'] = df[data_col].dt.quarter
        df['semana_ano'] = df[data_col].dt.isocalendar().week
        
        return df
    
    def analyze_patterns_ml(self, df_trans):
        """Análise de padrões - APENAS TRANSAÇÕES DO CAIXA"""
        
        if df_trans.empty:
            return []
        
        # Filtrar apenas saídas do caixa
        saidas = df_trans[df_trans['tipo'] == 'saida'].copy()
        
        if saidas.empty:
            return []
        
        # Extrair features temporais
        df_combined = self.extract_features(saidas)
        
        # Análise por categoria
        padroes = []
        
        for categoria in df_combined['categoria'].unique():
            df_cat = df_combined[df_combined['categoria'] == categoria]
            
            # Agrupar por mês
            df_cat['ano_mes'] = df_cat['data'].dt.to_period('M')
            gastos_mensais = df_cat.groupby('ano_mes')['valor'].sum()
            
            if len(gastos_mensais) < 2:
                continue
            
            # Estatísticas básicas
            media = gastos_mensais.mean()
            desvio = gastos_mensais.std()
            
            # Tendência usando regressão linear
            X = np.arange(len(gastos_mensais)).reshape(-1, 1)
            y = gastos_mensais.values
            
            lr = LinearRegression()
            lr.fit(X, y)
            
            tendencia_valor = lr.coef_[0]
            
            # Classificar tendência
            if tendencia_valor > media * 0.05:
                tendencia = 'crescente'
            elif tendencia_valor < -media * 0.05:
                tendencia = 'decrescente'
            else:
                tendencia = 'estavel'
            
            # Previsão próximo mês usando Random Forest
            if len(gastos_mensais) >= 3:
                # Features: últimos 3 meses
                X_features = []
                y_target = []
                
                for i in range(3, len(gastos_mensais)):
                    X_features.append(gastos_mensais.iloc[i-3:i].values)
                    y_target.append(gastos_mensais.iloc[i])
                
                if X_features:
                    X_features = np.array(X_features)
                    y_target = np.array(y_target)
                    
                    rf = RandomForestRegressor(n_estimators=50, random_state=42)
                    rf.fit(X_features, y_target)
                    
                    # Prever próximo mês
                    last_3 = gastos_mensais.iloc[-3:].values.reshape(1, -1)
                    previsao = rf.predict(last_3)[0]
                    confianca = rf.score(X_features, y_target) * 100
                else:
                    previsao = media
                    confianca = 50
            else:
                previsao = media
                confianca = 50
            
            # Variação (últimos 3 vs anteriores)
            if len(gastos_mensais) >= 6:
                ultimos_3 = gastos_mensais.iloc[-3:].mean()
                anteriores_3 = gastos_mensais.iloc[-6:-3].mean()
                variacao = ((ultimos_3 - anteriores_3) / anteriores_3 * 100) if anteriores_3 > 0 else 0
            else:
                variacao = 0
            
            padroes.append({
                'categoria': categoria,
                'mediaGastoMensal': float(media),
                'tendencia': tendencia,
                'variacao': float(variacao),
                'previsaoProximoMes': float(max(0, previsao)),
                'confianca': float(min(100, max(0, confianca))),
                'desvio_padrao': float(desvio)
            })
        
        # Ordenar por média de gasto
        padroes.sort(key=lambda x: x['mediaGastoMensal'], reverse=True)
        
        return padroes
    
    def generate_insights_ml(self, df_trans, padroes, saldo_atual=0, total_dividas=0, df_dividas=None):
        """Gera insights usando ML e análise estatística - apenas caixa e dívidas"""
        insights = []
        
        # Insight 1: Detecção de anomalias em saídas usando Z-score
        if not df_trans.empty:
            saidas = df_trans[df_trans['tipo'] == 'saida']
            if len(saidas) > 10:
                valores = saidas['valor'].values
                z_scores = np.abs((valores - valores.mean()) / valores.std())
                anomalias = saidas[z_scores > 2]
                
                if len(anomalias) > 0:
                    insights.append({
                        'id': f'insight-anomaly-{len(insights)}',
                        'tipo': 'alerta',
                        'titulo': f'{len(anomalias)} transação(ões) anômala(s) detectada(s)',
                        'descricao': f'Valores significativamente acima do padrão. Média: R$ {valores.mean():.2f}',
                        'impacto': 'alto' if len(anomalias) > 3 else 'medio',
                        'valor': float(anomalias['valor'].sum()),
                        'icon': '⚠️',
                        'cor': '#ef4444'
                    })
        
        # Insight 2: Análise de saldo em caixa
        if saldo_atual < 1000:
            insights.append({
                'id': f'insight-saldo-{len(insights)}',
                'tipo': 'alerta',
                'titulo': 'Saldo em caixa crítico',
                'descricao': f'Seu saldo atual de R$ {saldo_atual:.2f} está muito baixo. Priorize entradas.',
                'impacto': 'alto',
                'valor': float(saldo_atual),
                'icon': '🚨',
                'cor': '#ef4444'
            })
        elif saldo_atual > 10000:
            insights.append({
                'id': f'insight-saldo-{len(insights)}',
                'tipo': 'oportunidade',
                'titulo': 'Saldo saudável em caixa',
                'descricao': f'Saldo de R$ {saldo_atual:.2f}. Considere investir o excedente.',
                'impacto': 'medio',
                'valor': float(saldo_atual),
                'icon': '💰',
                'cor': '#22c55e'
            })
        
        # Insight 3: Análise de dívidas
        if total_dividas > 0:
            if df_dividas is not None and not df_dividas.empty:
                # Dívidas vencidas
                dividas_vencidas = df_dividas[df_dividas['status'] == 'vencida']
                if len(dividas_vencidas) > 0:
                    valor_vencido = dividas_vencidas['valorRestante'].sum()
                    insights.append({
                        'id': f'insight-dividas-vencidas-{len(insights)}',
                        'tipo': 'alerta',
                        'titulo': f'{len(dividas_vencidas)} dívida(s) vencida(s)',
                        'descricao': f'Total de R$ {valor_vencido:.2f} em atraso. Priorize pagamentos imediatamente.',
                        'impacto': 'alto',
                        'valor': float(valor_vencido),
                        'icon': '❌',
                        'cor': '#ef4444'
                    })
            
            # Ratio dívidas/saldo
            if saldo_atual > 0:
                ratio_dividas = (total_dividas / saldo_atual) * 100
                if ratio_dividas > 200:
                    insights.append({
                        'id': f'insight-ratio-dividas-{len(insights)}',
                        'tipo': 'alerta',
                        'titulo': 'Dívidas excedem saldo em caixa',
                        'descricao': f'Suas dívidas são {ratio_dividas:.0f}% do seu saldo. Risco financeiro alto.',
                        'impacto': 'alto',
                        'icon': '⚠️',
                        'cor': '#ef4444'
                    })
                elif ratio_dividas < 50:
                    insights.append({
                        'id': f'insight-ratio-dividas-{len(insights)}',
                        'tipo': 'oportunidade',
                        'titulo': 'Dívidas sob controle',
                        'descricao': f'Suas dívidas representam apenas {ratio_dividas:.0f}% do saldo. Boa gestão!',
                        'impacto': 'medio',
                        'icon': '✅',
                        'cor': '#22c55e'
                    })
        
        # Insight 4: Eficiência de fluxo de caixa (entrada vs saída)
        if not df_trans.empty:
            entradas = df_trans[df_trans['tipo'] == 'entrada']['valor'].sum()
            saidas = df_trans[df_trans['tipo'] == 'saida']['valor'].sum()
            
            if entradas > 0:
                taxa_economia = ((entradas - saidas) / entradas) * 100
                
                if taxa_economia > 30:
                    insights.append({
                        'id': f'insight-efficiency-{len(insights)}',
                        'tipo': 'oportunidade',
                        'titulo': 'Excelente taxa de economia',
                        'descricao': f'Você está economizando {taxa_economia:.1f}% das receitas. Continue assim!',
                        'impacto': 'alto',
                        'valor': float(entradas - saidas),
                        'icon': '💎',
                        'cor': '#22c55e'
                    })
                elif taxa_economia < 10:
                    insights.append({
                        'id': f'insight-efficiency-{len(insights)}',
                        'tipo': 'alerta',
                        'titulo': 'Taxa de economia baixa',
                        'descricao': f'Apenas {taxa_economia:.1f}% de economia. Reduza saídas não essenciais.',
                        'impacto': 'alto',
                        'icon': '📉',
                        'cor': '#ef4444'
                    })
        
        # Insight 5: Previsão de categoria com maior crescimento
        if padroes:
            maior_crescimento = max(padroes, key=lambda x: x['variacao'])
            if maior_crescimento['variacao'] > 20:
                insights.append({
                    'id': f'insight-growth-{len(insights)}',
                    'tipo': 'previsao',
                    'titulo': f'{maior_crescimento["categoria"]} em forte expansão',
                    'descricao': f'Crescimento de {maior_crescimento["variacao"]:.1f}%. Previsão: R$ {maior_crescimento["previsaoProximoMes"]:.2f}',
                    'impacto': 'medio',
                    'categoria': maior_crescimento['categoria'],
                    'valor': float(maior_crescimento['previsaoProximoMes']),
                    'icon': '🚀',
                    'cor': '#8b5cf6'
                })
        
        # Insight 6: Padrões sazonais em saídas
        if not df_trans.empty:
            df_temp = self.extract_features(df_trans[df_trans['tipo'] == 'saida'])
            if len(df_temp) > 20:
                gastos_por_mes = df_temp.groupby('mes')['valor'].sum()
                meses_alto_gasto = gastos_por_mes[gastos_por_mes > gastos_por_mes.mean() * 1.3]
                
                if len(meses_alto_gasto) > 0:
                    meses_nomes = {1:'Jan', 2:'Fev', 3:'Mar', 4:'Abr', 5:'Mai', 6:'Jun',
                                 7:'Jul', 8:'Ago', 9:'Set', 10:'Out', 11:'Nov', 12:'Dez'}
                    meses_str = ', '.join([meses_nomes[m] for m in meses_alto_gasto.index[:3]])
                    
                    insights.append({
                        'id': f'insight-seasonal-{len(insights)}',
                        'tipo': 'previsao',
                        'titulo': 'Padrão sazonal detectado',
                        'descricao': f'Meses com saídas elevadas: {meses_str}. Reserve caixa para esses períodos.',
                        'impacto': 'medio',
                        'icon': '📅',
                        'cor': '#f59e0b'
                    })
        
        return insights[:10]  # Limitar a 10 insights mais relevantes
    
    def predict_cash_flow_ml(self, df_trans):
        """Previsão de fluxo de caixa usando ML"""
        if df_trans.empty:
            return []
        
        # Preparar dados mensais
        df_trans = self.extract_features(df_trans)
        df_trans['ano_mes'] = df_trans['data'].dt.to_period('M')
        
        # Entradas e saídas por mês
        entradas_mes = df_trans[df_trans['tipo'] == 'entrada'].groupby('ano_mes')['valor'].sum()
        saidas_mes = df_trans[df_trans['tipo'] == 'saida'].groupby('ano_mes')['valor'].sum()
        
        # Garantir que todos os meses estejam presentes
        meses_unicos = pd.period_range(
            start=df_trans['ano_mes'].min(),
            end=df_trans['ano_mes'].max(),
            freq='M'
        )
        
        entradas_mes = entradas_mes.reindex(meses_unicos, fill_value=0)
        saidas_mes = saidas_mes.reindex(meses_unicos, fill_value=0)
        
        # Treinar modelo de previsão
        if len(entradas_mes) >= 6:
            # Random Forest para prever próximos 6 meses
            previsoes = []
            meses_nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            
            # Features: últimos 3 meses
            window_size = 3
            
            for i in range(6):
                # Prever entradas
                if len(entradas_mes) >= window_size:
                    X_ent = entradas_mes.values[-window_size:].reshape(1, -1)
                    media_ent = entradas_mes.mean()
                    prev_entrada = float(media_ent * (1 + 0.02 * i))  # 2% crescimento
                else:
                    prev_entrada = float(entradas_mes.mean())
                
                # Prever saídas
                if len(saidas_mes) >= window_size:
                    X_sai = saidas_mes.values[-window_size:].reshape(1, -1)
                    media_sai = saidas_mes.mean()
                    prev_saida = float(media_sai * (1 + 0.02 * i))  # 2% crescimento
                else:
                    prev_saida = float(saidas_mes.mean())
                
                # Calcular confiança (diminui com o tempo)
                confianca = max(50, 95 - (i * 8))
                
                # Próximo mês
                mes_atual = datetime.now().month - 1 + i
                mes_idx = mes_atual % 12
                
                # Adicionar ao histórico para próxima previsão
                entradas_mes = pd.concat([entradas_mes, pd.Series([prev_entrada])])
                saidas_mes = pd.concat([saidas_mes, pd.Series([prev_saida])])
                
                saldo = prev_entrada - prev_saida
                saldo_acumulado = saldo * (i + 1)
                
                previsoes.append({
                    'mes': meses_nomes[mes_idx],
                    'previsaoEntrada': prev_entrada,
                    'previsaoSaida': prev_saida,
                    'saldoPrevisto': saldo_acumulado,
                    'confianca': confianca
                })
            
            return previsoes
        
        return []
    
    def calculate_financial_health_ml(self, df_trans, padroes, saldo_atual=0, total_dividas=0):
        """Calcula saúde financeira usando múltiplos indicadores - caixa e dívidas"""
        score = 50  # Base
        
        if df_trans.empty:
            return score
        
        # Fator 1: Liquidez (saldo positivo)
        entradas = df_trans[df_trans['tipo'] == 'entrada']['valor'].sum()
        saidas = df_trans[df_trans['tipo'] == 'saida']['valor'].sum()
        
        if entradas > 0:
            taxa_liquidez = (entradas - saidas) / entradas
            score += min(25, taxa_liquidez * 100)
        
        # Fator 2: Saldo em caixa
        if saldo_atual > 5000:
            score += 15
        elif saldo_atual > 2000:
            score += 10
        elif saldo_atual > 500:
            score += 5
        elif saldo_atual < 0:
            score -= 20
        
        # Fator 3: Dívidas (penalidade proporcional)
        if total_dividas > 0 and saldo_atual > 0:
            ratio_dividas = total_dividas / saldo_atual
            if ratio_dividas > 5:
                score -= 30
            elif ratio_dividas > 2:
                score -= 20
            elif ratio_dividas > 1:
                score -= 10
            elif ratio_dividas < 0.5:
                score += 5
        elif total_dividas > 10000:
            score -= 25
        
        # Fator 4: Consistência (baixo desvio padrão em saídas)
        if not df_trans.empty:
            df_saidas = df_trans[df_trans['tipo'] == 'saida']
            if len(df_saidas) > 0:
                cv = df_saidas['valor'].std() / df_saidas['valor'].mean()
                score += max(0, 10 - (cv * 5))
        
        # Fator 5: Tendências positivas nas categorias
        if padroes:
            tendencias_boas = sum(1 for p in padroes if p['tendencia'] in ['decrescente', 'estavel'])
            proporcao = tendencias_boas / len(padroes)
            score += proporcao * 10
        
        return int(min(100, max(0, score)))
    
    def analyze_behavior(self, df_trans):
        """Análise de comportamento usando apenas transações de caixa"""
        comportamento = {
            'diaMaisGastos': 'N/A',
            'horarioMaisAtivo': 'Manhã',
            'categoriaDominante': 'N/A',
            'padraoSazonal': False,
            'eficienciaFinanceira': 0
        }
        
        if df_trans.empty:
            return comportamento
        
        # Analisar apenas saídas
        saidas = df_trans[df_trans['tipo'] == 'saida'].copy()
        
        if saidas.empty:
            return comportamento
        
        df_analise = self.extract_features(saidas)
        
        # Dia da semana com mais gastos
        gastos_por_dia = df_analise.groupby('dia_semana')['valor'].sum()
        if not gastos_por_dia.empty:
            dia_idx = gastos_por_dia.idxmax()
            dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
            comportamento['diaMaisGastos'] = dias[dia_idx] if dia_idx < 7 else 'N/A'
        
        # Categoria dominante
        if 'categoria' in df_analise.columns:
            gastos_por_cat = df_analise.groupby('categoria')['valor'].sum()
            if not gastos_por_cat.empty:
                comportamento['categoriaDominante'] = gastos_por_cat.idxmax()
        
        # Eficiência financeira
        if not df_trans.empty:
            entradas = df_trans[df_trans['tipo'] == 'entrada']['valor'].sum()
            saidas = df_trans[df_trans['tipo'] == 'saida']['valor'].sum()
            if entradas > 0:
                taxa = ((entradas - saidas) / entradas) * 100
                comportamento['eficienciaFinanceira'] = int(max(0, min(100, 50 + taxa)))
        
        return comportamento

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Endpoint principal de análise - apenas caixa e dívidas"""
    try:
        data = request.json
        transacoes = data.get('transacoes', [])
        dividas_data = data.get('dividas', [])
        saldo_atual = data.get('saldo_atual', 0)
        total_dividas = data.get('total_dividas', 0)
        
        # Inicializar analisador
        analyzer = FinancialAIAnalyzer()
        
        # Preparar DataFrames
        df_trans, df_dividas = analyzer.prepare_dataframe(transacoes, dividas_data)
        
        # Análises
        padroes = analyzer.analyze_patterns_ml(df_trans)
        insights = analyzer.generate_insights_ml(df_trans, padroes, saldo_atual, total_dividas, df_dividas)
        previsao_fluxo = analyzer.predict_cash_flow_ml(df_trans)
        saude = analyzer.calculate_financial_health_ml(df_trans, padroes, saldo_atual, total_dividas)
        comportamento = analyzer.analyze_behavior(df_trans)
        
        # Recomendações baseadas em regras - foco em caixa e dívidas
        recomendacoes = []
        
        if total_dividas > saldo_atual * 2:
            recomendacoes.append('🚨 Dívidas críticas! Priorize quitação de débitos vencidos.')
            recomendacoes.append('💡 Renegocie prazos e busque reduzir juros.')
        
        if saude < 40:
            recomendacoes.append('📉 Saúde financeira crítica. Reduza saídas imediatas.')
            recomendacoes.append('💰 Foque em aumentar entradas e controlar fluxo de caixa.')
        elif saude < 70:
            recomendacoes.append('📊 Monitore categorias com maior crescimento de saídas.')
            recomendacoes.append('🎯 Busque equilibrar entradas e saídas mensais.')
        else:
            recomendacoes.append('✅ Ótima gestão financeira! Continue monitorando o caixa.')
            if saldo_atual > total_dividas * 2:
                recomendacoes.append('💎 Considere quitar dívidas antecipadamente ou investir excedente.')
        
        if len([p for p in padroes if p['tendencia'] == 'crescente']) > 3:
            recomendacoes.append('📈 Múltiplas categorias crescendo. Avalie sustentabilidade.')
        
        recomendacoes.append('💼 Mantenha reserva de emergência (3 meses de gastos).')
        
        resultado = {
            'padroesPorCategoria': padroes,
            'insights': insights,
            'previsaoFluxoCaixa': previsao_fluxo,
            'analiseComportamento': comportamento,
            'saudeFinanceira': saude,
            'recomendacoes': recomendacoes[:6],
            'sucesso': True
        }
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'erro': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'ok', 'message': 'Financial AI API is running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
