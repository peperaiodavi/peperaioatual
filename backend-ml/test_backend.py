# Script de Teste - Backend ML
# Execute com: python test_backend.py

import requests
import json
from datetime import datetime, timedelta

# URL do backend
BASE_URL = "http://localhost:5000"

def test_health():
    """Testa health check"""
    print("🔍 Testando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend online:", response.json())
            return True
        else:
            print("❌ Backend respondeu com erro:", response.status_code)
            return False
    except Exception as e:
        print("❌ Backend offline:", str(e))
        return False

def test_analyze():
    """Testa análise completa"""
    print("\n🔍 Testando análise ML...")
    
    # Dados de teste
    hoje = datetime.now()
    transacoes = []
    
    # Entradas (receitas)
    for i in range(10):
        transacoes.append({
            'id': f'ent-{i}',
            'tipo': 'entrada',
            'valor': 5000 + (i * 500),
            'data': (hoje - timedelta(days=i*10)).isoformat(),
            'categoria': 'Receitas',
            'descricao': f'Entrada {i}'
        })
    
    # Saídas (despesas)
    categorias_saida = ['Aluguel', 'Alimentação', 'Transporte', 'Contas', 'Diversos']
    for i in range(20):
        transacoes.append({
            'id': f'sai-{i}',
            'tipo': 'saida',
            'valor': 1000 + (i * 100),
            'data': (hoje - timedelta(days=i*5)).isoformat(),
            'categoria': categorias_saida[i % len(categorias_saida)],
            'descricao': f'Saída {i}'
        })
    
    # Dívidas
    dividas = [
        {
            'id': 'div-1',
            'nome': 'Cartão Crédito',
            'valor': 5000,
            'valorRestante': 3000,
            'vencimento': (hoje + timedelta(days=10)).isoformat(),
            'status': 'ativa'
        },
        {
            'id': 'div-2',
            'nome': 'Empréstimo',
            'valor': 10000,
            'valorRestante': 8000,
            'vencimento': (hoje - timedelta(days=5)).isoformat(),
            'status': 'vencida'
        }
    ]
    
    # Calcular saldo e total dívidas
    entradas_total = sum(t['valor'] for t in transacoes if t['tipo'] == 'entrada')
    saidas_total = sum(t['valor'] for t in transacoes if t['tipo'] == 'saida')
    saldo_atual = entradas_total - saidas_total
    total_dividas = sum(d['valorRestante'] for d in dividas)
    
    payload = {
        'transacoes': transacoes,
        'dividas': dividas,
        'saldo_atual': saldo_atual,
        'total_dividas': total_dividas
    }
    
    print(f"📊 Saldo Atual: R$ {saldo_atual:.2f}")
    print(f"💳 Total Dívidas: R$ {total_dividas:.2f}")
    print(f"📈 {len(transacoes)} transações, {len(dividas)} dívidas")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            resultado = response.json()
            
            if resultado.get('sucesso'):
                print("\n✅ Análise concluída com sucesso!")
                print(f"🏥 Saúde Financeira: {resultado['saudeFinanceira']}/100")
                print(f"📊 Padrões encontrados: {len(resultado['padroesPorCategoria'])}")
                print(f"💡 Insights gerados: {len(resultado['insights'])}")
                print(f"📅 Previsões: {len(resultado['previsaoFluxoCaixa'])} meses")
                
                print("\n🔍 Primeiros Insights:")
                for insight in resultado['insights'][:3]:
                    print(f"  {insight['icon']} {insight['titulo']}")
                    print(f"     {insight['descricao']}")
                
                print("\n💡 Recomendações:")
                for rec in resultado['recomendacoes'][:3]:
                    print(f"  {rec}")
                
                return True
            else:
                print("❌ Análise retornou erro:", resultado.get('erro'))
                return False
        else:
            print("❌ Erro HTTP:", response.status_code)
            print(response.text)
            return False
            
    except Exception as e:
        print("❌ Erro na requisição:", str(e))
        return False

if __name__ == "__main__":
    print("🚀 Teste do Backend ML - Inteligência Financeira")
    print("=" * 60)
    
    # Teste 1: Health Check
    if not test_health():
        print("\n❌ Backend não está rodando!")
        print('Execute: cd "c:\\dev\\Peperaio Cvisual\\backend-ml" && py app.py')
        exit(1)
    
    # Teste 2: Análise
    if test_analyze():
        print("\n" + "=" * 60)
        print("✅ Todos os testes passaram!")
    else:
        print("\n" + "=" * 60)
        print("❌ Testes falharam")
        exit(1)
