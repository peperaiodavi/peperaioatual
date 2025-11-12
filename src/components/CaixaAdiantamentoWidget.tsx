import React, { useState, useEffect } from 'react';
import { Wallet, TrendingDown, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import './CaixaAdiantamentoWidget.css';

interface CaixaAdiantamento {
  id_caixa: string;
  saldo: number;
  updated_at: string;
}

interface DespesaAdiantamento {
  id_despesa: string;
  descricao: string;
  valor: number;
  data: string;
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
}

interface Props {
  userRole: 'admin' | 'visualizador';
}

const CaixaAdiantamentoWidget: React.FC<Props> = ({ userRole }) => {
  const [caixa, setCaixa] = useState<CaixaAdiantamento | null>(null);
  const [despesas, setDespesas] = useState<DespesaAdiantamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Carregar caixa de adiantamento
      const { data: caixaData, error: caixaError } = await supabase
        .from('caixa_adiantamento')
        .select('*')
        .eq('id_usuario', user.id)
        .single();

      if (caixaError && caixaError.code !== 'PGRST116') {
        console.error('Erro ao carregar caixa:', caixaError);
      }

      setCaixa(caixaData || null);

      // Carregar despesas recentes
      if (caixaData) {
        const { data: despesasData, error: despesasError } = await supabase
          .from('despesas_adiantamento')
          .select('*')
          .eq('id_caixa', caixaData.id_caixa)
          .order('data', { ascending: false })
          .limit(3);

        if (despesasError) {
          console.error('Erro ao carregar despesas:', despesasError);
        }

        setDespesas(despesasData || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados do caixa de adiantamento');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO': return '#10b981';
      case 'REPROVADO': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADO': return 'Aprovado';
      case 'REPROVADO': return 'Reprovado';
      default: return 'Pendente';
    }
  };

  if (loading) {
    return (
      <div className="caixa-adiantamento-widget loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!caixa) {
    return (
      <div className="caixa-adiantamento-widget empty">
        <AlertCircle size={32} />
        <h3>Caixa não disponível</h3>
        <p>Solicite ao administrador para configurar seu caixa de adiantamento.</p>
      </div>
    );
  }

  return (
    <div className="caixa-adiantamento-widget">
      <div className="widget-header">
        <div className="widget-icon">
          <Wallet size={24} />
        </div>
        <div className="widget-title-section">
          <h3>Caixa de Adiantamento</h3>
          <span className="widget-subtitle">Seu saldo disponível</span>
        </div>
      </div>

      <div className="widget-saldo">
        <span className="saldo-label">Saldo Atual</span>
        <span className="saldo-valor">{formatarMoeda(caixa.saldo)}</span>
      </div>

      {despesas.length > 0 && (
        <div className="widget-despesas">
          <div className="despesas-header">
            <FileText size={16} />
            <span>Últimas Despesas</span>
          </div>
          <div className="despesas-lista">
            {despesas.map((despesa) => (
              <div key={despesa.id_despesa} className="despesa-item">
                <div className="despesa-info">
                  <TrendingDown size={14} />
                  <span className="despesa-descricao">{despesa.descricao}</span>
                </div>
                <div className="despesa-valor-status">
                  <span className="despesa-valor">-{formatarMoeda(despesa.valor)}</span>
                  <span 
                    className="despesa-status"
                    style={{ 
                      backgroundColor: `${getStatusColor(despesa.status)}20`,
                      color: getStatusColor(despesa.status)
                    }}
                  >
                    {getStatusLabel(despesa.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="widget-ver-mais" onClick={() => window.location.href = '/caixa-adiantamento'}>
        Ver Detalhes →
      </button>
    </div>
  );
};

export default CaixaAdiantamentoWidget;
