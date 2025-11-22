import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress,
  Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

interface DadosFinanceiros {
  saldo: number;
  receitas: number;
  despesas: number;
  saudeFinanceira: 'excelente' | 'boa' | 'moderada' | 'atencao';
  principais_gastos: { categoria: string; valor: number }[];
}

export default function PepIAMonitoramento() {
  const { user } = useAuth();
  const [dados, setDados] = useState<DadosFinanceiros>({
    saldo: 0,
    receitas: 0,
    despesas: 0,
    saudeFinanceira: 'boa',
    principais_gastos: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarDadosReais();
  }, [user]);

  const buscarDadosReais = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      console.log('🔍 Buscando dados REAIS do sistema (mesma lógica do Caixa)');
      
      // BUSCAR TRANSAÇÕES (mesma query do Caixa.tsx)
      const { data: transacoes, error: erroTransacoes } = await supabase
        .from('transacoes')
        .select('tipo, valor, origem');
      
      const { data: obras, error: erroObras } = await supabase
        .from('obras')
        .select('*');
      
      const { data: propostas, error: erroPropostas } = await supabase
        .from('propostas')
        .select('*');
      
      const { data: gastos, error: erroGastos } = await supabase
        .from('gastos_obra')
        .select('*');
      
      const { data: funcionarios, error: erroFuncionarios } = await supabase
        .from('funcionarios')
        .select('*');
      
      const { data: compromissos, error: erroCompromissos } = await supabase
        .from('compromissos')
        .select('*');
      
      const { data: dividas, error: erroDividas } = await supabase
        .from('dividas')
        .select('*');

      console.log('📊 DADOS CARREGADOS:');
      console.log('  Transações:', transacoes?.length, erroTransacoes || '✅ OK');
      console.log('  Obras:', obras?.length, erroObras || '✅ OK');
      console.log('  Propostas:', propostas?.length, erroPropostas || '✅ OK');
      console.log('  Gastos de Obra:', gastos?.length, erroGastos || '✅ OK');
      console.log('  Funcionários:', funcionarios?.length, erroFuncionarios || '✅ OK');
      console.log('  Compromissos:', compromissos?.length, erroCompromissos || '✅ OK');
      console.log('  Dívidas:', dividas?.length, erroDividas || '✅ OK');

      if (erroTransacoes || erroObras || erroPropostas) {
        console.error('❌ ERROS:', { erroTransacoes, erroObras, erroPropostas });
      }

      // ============================================
      // CÁLCULO DO SALDO REAL (mesma lógica do Caixa.tsx linha 198-205)
      // ============================================
      const saldoCaixa = transacoes?.reduce((acc, t) => {
        return t.tipo === 'entrada' ? acc + t.valor : acc - t.valor;
      }, 0) || 0;
      
      console.log('💰 SALDO DO CAIXA (REAL):', saldoCaixa.toFixed(2));

      // RECEITAS = Total de entradas do caixa
      const receitas = transacoes?.filter(t => t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0) || 0;
      
      // DESPESAS = Total de saídas do caixa
      const despesas = transacoes?.filter(t => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0) || 0;

      console.log('📈 RESUMO FINANCEIRO (CAIXA REAL):');
      console.log('  🔵 TOTAL RECEITAS (entradas):', receitas.toFixed(2));
      console.log('  🔴 TOTAL DESPESAS (saídas):', despesas.toFixed(2));
      console.log('  💰 SALDO FINAL:', saldoCaixa.toFixed(2));

      // ESTATÍSTICAS
      const obrasAtivas = obras?.filter(o => !o.finalizada).length || 0;
      const obrasFinalizadas = obras?.filter(o => o.finalizada === true).length || 0;
      const propostasAbertas = propostas?.filter(p => 
        p.status === 'pendente' || p.status === 'aberta' || p.status === 'enviada'
      ).length || 0;
      const propostasAprovadas = propostas?.filter(p => 
        p.status === 'aprovada' || p.status === 'aprovado'
      ).length || 0;

      console.log('📊 ESTATÍSTICAS:');
      console.log('  🏗️ Obras Ativas:', obrasAtivas);
      console.log('  ✅ Obras Finalizadas:', obrasFinalizadas);
      console.log('  📋 Propostas Abertas:', propostasAbertas);
      console.log('  ✅ Propostas Aprovadas:', propostasAprovadas);

      // Agrupar gastos por categoria
      const gastoPorCategoria: { [key: string]: number } = {};
      gastos?.forEach(g => {
        const cat = g.categoria || 'Outros';
        gastoPorCategoria[cat] = (gastoPorCategoria[cat] || 0) + (parseFloat(g.valor) || 0);
      });

      const principais_gastos = Object.entries(gastoPorCategoria)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      // Calcular saúde financeira baseada na MARGEM REAL
      const margem = receitas > 0 ? ((saldoCaixa) / receitas) * 100 : 0;
      let saudeFinanceira: 'excelente' | 'boa' | 'moderada' | 'atencao' = 'atencao';
      if (margem > 50) saudeFinanceira = 'excelente';
      else if (margem > 30) saudeFinanceira = 'boa';
      else if (margem > 10) saudeFinanceira = 'moderada';

      console.log('💊 Saúde Financeira:', saudeFinanceira, `(margem: ${margem.toFixed(1)}%)`);

      setDados({ 
        saldo: saldoCaixa,  // SALDO REAL DO CAIXA
        receitas, 
        despesas, 
        saudeFinanceira, 
        principais_gastos 
      });
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
    }
    setLoading(false);
  };

  const calcularPercentual = (valor: number, total: number) => {
    return ((valor / total) * 100).toFixed(1);
  };

  const getSaudeColor = (saude: string) => {
    switch (saude) {
      case 'excelente': return '#34C759';
      case 'boa': return '#5AC8FA';
      case 'moderada': return '#FF9500';
      case 'atencao': return '#FF3B30';
      default: return '#999';
    }
  };

  const getSaudeIcon = (saude: string) => {
    return saude === 'atencao' ? <WarningAmberIcon /> : <CheckCircleIcon />;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
        Monitoramento do Sistema
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        Análise completa da saúde financeira e principais métricas do seu negócio.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 3 } }}>
        {/* Card Saldo */}
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
          color: '#fff'
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Saldo Atual</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              R$ {dados.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>

        {/* Card Receitas */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#34C759', fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Receitas (mês)</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#34C759', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              R$ {dados.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>

        {/* Card Despesas */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDownIcon sx={{ mr: 1, color: '#FF3B30', fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Despesas (mês)</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF3B30', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              R$ {dados.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 3 } }}>
        {/* Card Saúde Financeira */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3, mb: { xs: 2, md: 3 } }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Saúde Financeira
              </Typography>
              <Chip 
                icon={getSaudeIcon(dados.saudeFinanceira)}
                label={dados.saudeFinanceira.toUpperCase()} 
                sx={{ 
                  bgcolor: getSaudeColor(dados.saudeFinanceira),
                    color: '#fff',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {dados.saudeFinanceira === 'excelente' && 'Parabéns! Suas finanças estão em excelente estado. Continue assim!'}
                {dados.saudeFinanceira === 'boa' && 'Suas finanças estão em bom estado. Monitore os gastos para manter o equilíbrio.'}
                {dados.saudeFinanceira === 'moderada' && 'Atenção! É importante revisar seus gastos e buscar aumentar as receitas.'}
                {dados.saudeFinanceira === 'atencao' && 'Alerta! É urgente tomar ações para melhorar a situação financeira.'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Margem de Lucro</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={((dados.receitas - dados.despesas) / dados.receitas) * 100}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#eee',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSaudeColor(dados.saudeFinanceira)
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {calcularPercentual(dados.receitas - dados.despesas, dados.receitas)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

        {/* Card Principais Gastos */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaymentsIcon sx={{ mr: 1, color: '#007AFF', fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Principais Gastos
              </Typography>
            </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dados.principais_gastos.map((gasto, idx) => (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>{gasto.categoria}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={parseFloat(calcularPercentual(gasto.valor, dados.despesas))}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: '#eee',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#007AFF'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {calcularPercentual(gasto.valor, dados.despesas)}% do total
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
      </Box>
    </Box>
  );
}
