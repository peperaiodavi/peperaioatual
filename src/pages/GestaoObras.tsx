import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { useCardsDeObra } from '../hooks/useCardsDeObra';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Link2, HardHat, Building2 } from 'lucide-react';
import type { CardDeObra } from '../types/financeiro';
import './GestaoObras.css';

interface ObraOption {
  id: string;
  nome: string;
  orcamento: number;
  finalizada: boolean;
}

interface FuncionarioOption {
  id: string;
  nome: string;
  email: string;
}

export default function GestaoObras() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissao();
  const { cards, loading: cardsLoading, transferirVerba, carregarCards } = useCardsDeObra();
  const [obras, setObras] = useState<ObraOption[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gestaoForm, setGestaoForm] = useState({ obraId: '', funcionarioId: '', valorInicial: '' });
  const cardsAtivos = cards.filter(
    (card) => card.status !== 'FINALIZADO' && card.status !== 'CANCELADO'
  );

  useEffect(() => {
    if (!isAdmin) return;
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadObras(), loadFuncionarios()]);
      setLoading(false);
    };
    loadData();
  }, [isAdmin]);

  const loadObras = async () => {
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome, orcamento, finalizada')
      .order('nome');

    if (error) {
      console.error('Erro ao carregar obras:', error);
      toast.error('Erro ao carregar obras disponíveis');
      return;
    }

    setObras((data || []).filter((obra) => !obra.finalizada));
  };

  const loadFuncionarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, permissao')
      .eq('permissao', 'visualizador')
      .order('nome');

    if (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários');
      return;
    }

    setFuncionarios((data || []).map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    })));
  };

  const handleVincularObraUsuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;

    const { obraId, funcionarioId, valorInicial } = gestaoForm;

    if (!obraId || !funcionarioId) {
      toast.error('Selecione a obra e o funcionário responsável');
      return;
    }

    try {
      setSubmitting(true);

      const { data: obraData, error: obraError } = await supabase
        .from('obras')
        .select('*')
        .eq('id', obraId)
        .single();

      if (obraError || !obraData) {
        throw obraError || new Error('Obra não encontrada');
      }

      const tituloObra = obraData.nome || obraData.titulo || 'Obra';

      const { data: cardsExistentes, error: errorBusca } = await supabase
        .from('cards_de_obra')
        .select('*')
        .eq('titulo', tituloObra)
        .eq('id_visualizador_responsavel', funcionarioId)
        .limit(1);

      if (errorBusca) throw errorBusca;

      let card: CardDeObra | null = cardsExistentes?.[0] ?? null;

      if (!card) {
        const { data: cardCriado, error: errorCriar } = await supabase
          .from('cards_de_obra')
          .insert({
            id_visualizador_responsavel: funcionarioId,
            titulo: tituloObra,
            nome_cliente: tituloObra,
            valor_venda_orcamento: obraData.orcamento || obraData.valor_venda_orcamento || 0,
            saldo_atual: 0,
            total_gasto: 0,
            status: 'EM_ANDAMENTO',
          })
          .select()
          .single();

        if (errorCriar) throw errorCriar;
        card = cardCriado as CardDeObra;
      }

      const valorNormalizado = valorInicial.replace(',', '.');
      const valor = parseFloat(valorNormalizado) || 0;

      if (valor > 0 && card) {
        await transferirVerba(card, valor);
      }

      await carregarCards();
      await loadObras();

      toast.success('Obra vinculada com sucesso!');
      setGestaoForm({ obraId: '', funcionarioId: '', valorInicial: '' });
    } catch (error) {
      console.error('Erro ao vincular obra:', error);
      toast.error('Erro ao vincular obra');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="gestao-obras-page">
        <div className="gestao-obras-container">
          <h2 className="gestao-title">Acesso Restrito</h2>
          <p className="gestao-info">Você não tem permissão para acessar esta página.</p>
          <Button variant="outline" onClick={() => navigate('/obras')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para Obras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="gestao-obras-page">
      {/* Header */}
      <div className="gestao-header">
        <div className="gestao-header-content">
          <h1>
            <div className="gestao-header-icon">
              <Building2 size={24} />
            </div>
            Gestão de Obras
          </h1>
          <p>Vincule obras aos responsáveis e defina a verba inicial diretamente</p>
        </div>
        <div className="gestao-header-actions">
          <button className="obras-btn" onClick={() => navigate('/obras')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para Obras
          </button>
          <button className="obras-btn obras-btn-primary" onClick={() => navigate('/cards-de-obra')}>
            <HardHat className="h-4 w-4" />
            Abrir Cards de Obra
          </button>
        </div>
      </div>

      {/* Container Principal */}
      <div className="gestao-obras-container">
        <h2 className="gestao-title">Vincular obra ao funcionário</h2>
        <p className="gestao-info">
          Selecione a obra ativa, o responsável e (opcionalmente) defina o valor inicial a ser transferido para o card.
          A verba será debitada do caixa, lançada como gasto da obra e o orçamento será atualizado automaticamente.
        </p>

        {loading ? (
          <div className="gestao-loading">Carregando obras e funcionários</div>
        ) : obras.length === 0 ? (
          <div className="gestao-empty">
            Nenhuma obra ativa disponível para vinculação. Cadastre uma nova obra primeiro.
          </div>
        ) : (
          <form className="gestao-form" onSubmit={handleVincularObraUsuario}>
            <div className="gestao-grid">
              <div className="gestao-field">
                <Label>Obra</Label>
                <select
                  value={gestaoForm.obraId}
                  onChange={(event) => setGestaoForm({ ...gestaoForm, obraId: event.target.value })}
                  required
                >
                  <option value="">Selecione uma obra</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gestao-field">
                <Label>Funcionário</Label>
                <select
                  value={gestaoForm.funcionarioId}
                  onChange={(event) => setGestaoForm({ ...gestaoForm, funcionarioId: event.target.value })}
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome || funcionario.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gestao-field">
                <Label>Verba inicial (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gestaoForm.valorInicial}
                  onChange={(event) => setGestaoForm({ ...gestaoForm, valorInicial: event.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="gestao-actions">
              <button type="submit" disabled={submitting}>
                <Link2 className="h-4 w-4" />
                {submitting ? 'Vinculando...' : 'Vincular obra'}
              </button>
              <button type="button" onClick={() => navigate('/cards-de-obra')}>
                <HardHat className="h-4 w-4" />
                Ir para Cards de Obra
              </button>
            </div>
          </form>
        )}

        {/* Stats */}
        <div className="gestao-stats">
          <div className="gestao-stat-card">
            <span className="gestao-stat-label">Obras Ativas</span>
            <span className="gestao-stat-value">{obras.length}</span>
          </div>
          <div className="gestao-stat-card">
            <span className="gestao-stat-label">Funcionários</span>
            <span className="gestao-stat-value">{funcionarios.length}</span>
          </div>
          <div className="gestao-stat-card">
            <span className="gestao-stat-label">Cards Ativos</span>
            <span className="gestao-stat-value">
              {cardsLoading ? '...' : cardsAtivos.length}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="gestao-features">
          <li>Após a vinculação, envie novas verbas pelo módulo Obras &gt; Enviar Verba</li>
          <li>Os gastos lançados pelos colaboradores atualizam o card em tempo real</li>
          <li>Finalize a obra aprovando o card correspondente no painel de cards</li>
        </ul>
      </div>
    </div>
  );
}
