import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ConstructionIcon from '@mui/icons-material/Construction';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ObraAnalise {
  id: string;
  nome: string;
  orcamento: number;
  lucro: number;
  valor_recebido: number;
  finalizada: boolean;
  gastos: number;
  margem: number;
  status: 'lucrativa' | 'prejuizo' | 'atencao';
}

interface Recomendacao {
  tipo: 'sucesso' | 'alerta' | 'critico';
  titulo: string;
  descricao: string;
}

export default function PepIAAnaliseObras() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [obras, setObras] = useState<ObraAnalise[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    margemMediaLucrativas: 0,
    obrasMaisLucrativas: '',
    categoriaGastoMaior: '',
    economiaPotencial: 0
  });

  useEffect(() => {
    if (user) analisarObras();
  }, [user]);

  const analisarObras = async () => {
    setLoading(true);
    try {
      // 1. Buscar obras
      const { data: obrasData } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });

      if (!obrasData) {
        setLoading(false);
        return;
      }

      // 2. Buscar gastos por obra
      const { data: gastosData } = await supabase
        .from('gastos_obra')
        .select('*');

      // 3. Calcular análise para cada obra
      const obrasAnalisadas: ObraAnalise[] = obrasData.map(obra => {
        const gastosObra = gastosData?.filter(g => g.obra_id === obra.id) || [];
        const totalGastos = gastosObra.reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0);
        
        const orcamento = parseFloat(obra.orcamento) || 0;
        const valorRecebido = parseFloat(obra.valor_recebido) || 0;
        const finalizada = obra.finalizada || false;
        
        // CORREÇÃO: Obras em aberto usam ORÇAMENTO, finalizadas usam VALOR RECEBIDO
        const lucroReal = finalizada 
          ? (valorRecebido - totalGastos)  // Finalizadas: lucro real recebido
          : (orcamento - totalGastos);     // Em aberto: lucro projetado do orçamento
        
        const margem = orcamento > 0 ? ((lucroReal / orcamento) * 100) : 0;

        let status: 'lucrativa' | 'prejuizo' | 'atencao' = 'atencao';
        if (margem > 20) status = 'lucrativa';
        else if (margem < 0) status = 'prejuizo';

        return {
          id: obra.id,
          nome: obra.nome,
          orcamento,
          lucro: lucroReal,
          valor_recebido: valorRecebido,
          finalizada,
          gastos: totalGastos,
          margem,
          status
        };
      });

      setObras(obrasAnalisadas);

      // 4. Gerar recomendações inteligentes
      const recs = gerarRecomendacoes(obrasAnalisadas, gastosData || []);
      setRecomendacoes(recs);

      // 5. Calcular estatísticas
      calcularEstatisticas(obrasAnalisadas, gastosData || []);

    } catch (err) {
      console.error('Erro ao analisar obras:', err);
    }
    setLoading(false);
  };

  const gerarRecomendacoes = (obras: ObraAnalise[], gastos: any[]): Recomendacao[] => {
    const recs: Recomendacao[] = [];

    // Obras com prejuízo
    const obrasPrejuizo = obras.filter(o => o.status === 'prejuizo');
    if (obrasPrejuizo.length > 0) {
      recs.push({
        tipo: 'critico',
        titulo: `${obrasPrejuizo.length} obras com prejuízo detectadas`,
        descricao: `${obrasPrejuizo.map(o => o.nome).join(', ')} estão operando com margem negativa. Revise os custos imediatamente.`
      });
    }

    // Obras muito lucrativas (padrão de sucesso)
    const obrasLucrativas = obras.filter(o => o.margem > 30);
    if (obrasLucrativas.length > 0) {
      recs.push({
        tipo: 'sucesso',
        titulo: `Padrão de sucesso identificado`,
        descricao: `${obrasLucrativas.map(o => o.nome).join(', ')} têm margem superior a 30%. Analise os fatores de sucesso para replicar.`
      });
    }

    // Análise de gastos por categoria
    const gastosPorCategoria: { [key: string]: number } = {};
    gastos.forEach(g => {
      const cat = g.categoria || 'Outros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + parseFloat(g.valor);
    });

    const categoriaMaior = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])[0];

    if (categoriaMaior) {
      recs.push({
        tipo: 'alerta',
        titulo: `Categoria "${categoriaMaior[0]}" concentra maiores gastos`,
        descricao: `R$ ${categoriaMaior[1].toFixed(2)} gastos em ${categoriaMaior[0]}. Busque fornecedores alternativos ou negocie preços.`
      });
    }

    // Obras ativas sem recebimento
    const obrasSemRecebimento = obras.filter(o => !o.finalizada && o.valor_recebido === 0);
    if (obrasSemRecebimento.length > 0) {
      recs.push({
        tipo: 'alerta',
        titulo: `${obrasSemRecebimento.length} obras ativas sem recebimento`,
        descricao: `${obrasSemRecebimento.map(o => o.nome).join(', ')} ainda não geraram entrada de caixa. Solicite adiantamento.`
      });
    }

    // Obras finalizadas com lucro baixo
    const obrasFinalizadasBaixoLucro = obras.filter(o => o.finalizada && o.margem < 15 && o.margem > 0);
    if (obrasFinalizadasBaixoLucro.length > 0) {
      recs.push({
        tipo: 'alerta',
        titulo: `Margem abaixo do ideal em obras concluídas`,
        descricao: `${obrasFinalizadasBaixoLucro.map(o => o.nome).join(', ')} tiveram margem inferior a 15%. Revise precificação.`
      });
    }

    return recs;
  };

  const calcularEstatisticas = (obras: ObraAnalise[], gastos: any[]) => {
    const obrasLucrativas = obras.filter(o => o.status === 'lucrativa');
    const margemMedia = obrasLucrativas.length > 0
      ? obrasLucrativas.reduce((acc, o) => acc + o.margem, 0) / obrasLucrativas.length
      : 0;

    const obraMaisLucrativa = obras.reduce((max, o) => o.lucro > max.lucro ? o : max, obras[0] || { lucro: 0, nome: '' });

    const gastosPorCategoria: { [key: string]: number } = {};
    gastos.forEach(g => {
      const cat = g.categoria || 'Outros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + parseFloat(g.valor);
    });
    const categoriaMaior = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])[0];

    // Economia potencial: 5% de redução na categoria maior
    const economiaPotencial = categoriaMaior ? categoriaMaior[1] * 0.05 : 0;

    setEstatisticas({
      margemMediaLucrativas: margemMedia,
      obrasMaisLucrativas: obraMaisLucrativa?.nome || 'N/A',
      categoriaGastoMaior: categoriaMaior ? categoriaMaior[0] : 'N/A',
      economiaPotencial
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
        Análise Inteligente de Obras
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        Insights baseados em dados reais para aumentar sua lucratividade
      </Typography>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* CARDS DE ESTATÍSTICAS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#E8F5E9', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Margem Média (Lucrativas)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                {estatisticas.margemMediaLucrativas.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#E3F2FD', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Obra Mais Lucrativa</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1565C0', fontSize: 14 }}>
                {estatisticas.obrasMaisLucrativas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF3E0', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Categoria com Maior Gasto</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#E65100', fontSize: 14 }}>
                {estatisticas.categoriaGastoMaior}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F3E5F5', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Economia Potencial (5%)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#6A1B9A' }}>
                R$ {estatisticas.economiaPotencial.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RECOMENDAÇÕES */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
        🎯 Recomendações Estratégicas
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {recomendacoes.map((rec, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Alert 
              severity={rec.tipo === 'critico' ? 'error' : rec.tipo === 'alerta' ? 'warning' : 'success'}
              icon={rec.tipo === 'sucesso' ? <CheckCircleIcon /> : <WarningAmberIcon />}
              sx={{ boxShadow: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{rec.titulo}</Typography>
              <Typography variant="body2">{rec.descricao}</Typography>
            </Alert>
          </Grid>
        ))}
      </Grid>

      {/* TABELA DE OBRAS */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
        📊 Detalhamento por Obra
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Obra</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Orçamento</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Gastos</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Recebido</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Lucro Real</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Margem</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {obras.map(obra => (
              <TableRow key={obra.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConstructionIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {obra.nome}
                    </Typography>
                    {obra.finalizada && (
                      <Chip label="Finalizada" size="small" color="default" sx={{ height: 20 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">R$ {obra.orcamento.toFixed(2)}</TableCell>
                <TableCell align="right">R$ {obra.gastos.toFixed(2)}</TableCell>
                <TableCell align="right">R$ {obra.valor_recebido.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: obra.lucro >= 0 ? '#2E7D32' : '#C62828'
                    }}
                  >
                    R$ {obra.lucro.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {obra.margem >= 0 ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                    ) : (
                      <TrendingDownIcon fontSize="small" sx={{ color: '#C62828' }} />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: obra.margem >= 20 ? '#2E7D32' : obra.margem < 0 ? '#C62828' : '#F57C00'
                      }}
                    >
                      {obra.margem.toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={obra.status === 'lucrativa' ? 'Lucrativa' : obra.status === 'prejuizo' ? 'Prejuízo' : 'Atenção'}
                    color={obra.status === 'lucrativa' ? 'success' : obra.status === 'prejuizo' ? 'error' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {obras.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nenhuma obra cadastrada ainda. Cadastre obras para começar a análise inteligente.
        </Alert>
      )}
    </Box>
  );
}
