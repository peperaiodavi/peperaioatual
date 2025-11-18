// QuickTransactionCard - Lançamento Rápido de Transações
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  X,
  Check,
  Building2,
  Wallet
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import './QuickTransactionCard.css';

interface Obra {
  id: string;
  nome: string;
  id_card?: string;
}

// MESMAS CATEGORIAS DA SEÇÃO OBRAS
const CATEGORIAS_GASTOS_OBRA = [
  { value: 'Material', label: '🧱 Material' },
  { value: 'Combustível', label: '⛽ Combustível' },
  { value: 'Alimentação', label: '🍽️ Alimentação' },
  { value: 'Funcionário', label: '👷 Funcionário' },
  { value: 'Frete', label: '🚚 Frete' },
];

export default function QuickTransactionCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<'entrada' | 'saida'>('entrada');
  const [obras, setObras] = useState<Obra[]>([]);
  const [form, setForm] = useState({
    valor: '',
    origem: '',
    observacao: '',
    obraId: '',
    categoria: '',
    categoriaGasto: '' // Categoria do gasto da obra
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('QuickTransactionCard montado - carregando dados...');
    carregarObras();
  }, []);

  const carregarObras = async () => {
    try {
      // MESMA QUERY DA SEÇÃO OBRAS
      const { data, error } = await supabase
        .from('obras')
        .select('*');

      if (error) {
        console.error('Erro ao carregar obras:', error);
        throw error;
      }
      
      console.log('Obras carregadas:', data);
      setObras(data || []);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
      toast.error('Erro ao carregar obras');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validação para gasto de obra
      if (tipoTransacao === 'saida' && form.obraId) {
        if (!form.valor || !form.categoriaGasto || !form.observacao) {
          toast.error('Preencha todos os campos obrigatórios do gasto');
          return;
        }
      } 
      // Validação para transação normal
      else {
        if (!form.valor || !form.origem) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
      }

      const valor = parseFloat(form.valor.replace(/[^\d,]/g, '').replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        toast.error('Valor inválido');
        return;
      }

      setLoading(true);

      const dataAtual = new Date().toISOString().split('T')[0];

      // FLUXO 1: Saída com obra vinculada (Gasto de Obra) - IGUAL À SEÇÃO OBRAS
      if (tipoTransacao === 'saida' && form.obraId && form.categoriaGasto) {
        // Buscar nome da obra
        const obraSelecionada = obras.find(o => o.id === form.obraId);
        const nomeObra = obraSelecionada?.nome || 'Obra';

        // 1. Adicionar gasto na tabela gastos_obra (IGUAL À SEÇÃO OBRAS)
        const { error: gastoError } = await supabase
          .from('gastos_obra')
          .insert({
            obra_id: form.obraId,
            categoria: form.categoriaGasto,
            descricao: form.observacao,
            valor: valor,
            data: dataAtual,
          });
        
        if (gastoError) {
          console.error('Erro ao adicionar gasto:', gastoError);
          toast.error('Erro ao adicionar gasto na obra');
          return;
        }

        // 2. Registrar saída no caixa (IGUAL À SEÇÃO OBRAS)
        const { error: caixaError } = await supabase
          .from('transacoes')
          .insert({
            tipo: 'saida',
            valor: valor,
            origem: `${nomeObra} - ${form.categoriaGasto}`,
            data: dataAtual,
            observacao: form.observacao,
          });
        
        if (caixaError) {
          console.error('Erro ao registrar no caixa:', caixaError);
          toast.warning('Gasto adicionado, mas não foi registrado no caixa');
        }

        toast.success('Gasto adicionado e registrado no caixa!');
      } 
      // FLUXO 2: Entrada ou Saída sem obra (Transação normal)
      else {
        const transacaoData = {
          tipo: tipoTransacao,
          valor: valor,
          origem: form.origem,
          data: dataAtual,
          observacao: form.observacao || '',
          categoria: form.categoria || (tipoTransacao === 'entrada' ? 'Receita' : 'Despesa')
        };

        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert([transacaoData]);

        if (transacaoError) throw transacaoError;

        toast.success(`${tipoTransacao === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      }
      
      // Limpar formulário
      setForm({
        valor: '',
        origem: '',
        observacao: '',
        obraId: '',
        categoria: '',
        categoriaGasto: ''
      });
      setIsExpanded(false);

    } catch (error) {
      console.error('Erro ao registrar transação:', error);
      toast.error('Erro ao registrar transação');
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (!numeros) return '';
    const valorNumerico = parseFloat(numeros) / 100;
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarValor(e.target.value);
    setForm({ ...form, valor: valorFormatado });
  };

  return (
    <>
      {/* Card Compacto */}
      <motion.div 
        className="quick-transaction-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onClick={() => setIsExpanded(true)}
      >
        <div className="quick-card-header">
          <div className="quick-card-icon">
            <DollarSign size={24} />
          </div>
          <div className="quick-card-info">
            <h3>Lançamento Rápido</h3>
            <p>Registrar entrada ou saída</p>
          </div>
        </div>

        <div className="quick-card-actions">
          <button className="quick-btn entrada">
            <TrendingUp size={18} />
            <span>Entrada</span>
          </button>
          <button className="quick-btn saida">
            <TrendingDown size={18} />
            <span>Saída</span>
          </button>
        </div>
      </motion.div>

      {/* Modal Expandido (Renderizado via Portal) */}
      {createPortal(
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Backdrop */}
              <motion.div
                className="quick-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
              />

              {/* Modal */}
              <motion.div
              className="quick-modal"
              initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 20px)" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 20px)" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="quick-modal-header">
                <h2>Lançamento Rápido</h2>
                <button 
                  className="quick-modal-close"
                  onClick={() => setIsExpanded(false)}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tipo de Transação */}
              <div className="quick-modal-tipos">
                <button
                  className={`quick-tipo-btn ${tipoTransacao === 'entrada' ? 'active entrada' : ''}`}
                  onClick={() => setTipoTransacao('entrada')}
                >
                  <TrendingUp size={20} />
                  <span>Entrada</span>
                </button>
                <button
                  className={`quick-tipo-btn ${tipoTransacao === 'saida' ? 'active saida' : ''}`}
                  onClick={() => setTipoTransacao('saida')}
                >
                  <TrendingDown size={20} />
                  <span>Saída</span>
                </button>
              </div>

              {/* Formulário */}
              <div className="quick-modal-form">
                {/* Valor - sempre visível */}
                <div className="quick-form-group">
                  <label>Valor (R$) *</label>
                  <div className="quick-input-wrapper">
                    <DollarSign size={18} className="quick-input-icon" />
                    <input
                      type="text"
                      placeholder="0,00"
                      value={form.valor}
                      onChange={handleValorChange}
                      className="quick-input-valor"
                    />
                  </div>
                </div>

                {/* SAÍDA */}
                {tipoTransacao === 'saida' && (
                  <>
                    <div className="quick-form-group">
                      <label>
                        <Building2 size={16} />
                        Vincular à Obra (opcional)
                      </label>
                      <select
                        value={form.obraId}
                        onChange={(e) => setForm({ ...form, obraId: e.target.value, categoriaGasto: '' })}
                        className="quick-select"
                      >
                        <option value="">Gasto Externo (Sem vínculo)</option>
                        {obras.map(obra => (
                          <option key={obra.id} value={obra.id}>
                            {obra.nome}
                          </option>
                        ))}
                      </select>
                      <small className="quick-hint">
                        Se não selecionar, o gasto será registrado apenas no caixa
                      </small>
                    </div>

                    {/* Campos para gasto de obra */}
                    {form.obraId ? (
                      <>
                        <div className="quick-form-group">
                          <label>Categoria do Gasto *</label>
                          <select
                            value={form.categoriaGasto}
                            onChange={(e) => setForm({ ...form, categoriaGasto: e.target.value })}
                            className="quick-select"
                            required
                          >
                            <option value="">Selecione uma categoria</option>
                            {CATEGORIAS_GASTOS_OBRA.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="quick-form-group">
                          <label>Descrição do Gasto *</label>
                          <input
                            type="text"
                            placeholder="Ex: Cimento para fundação"
                            value={form.observacao}
                            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                            className="quick-input"
                          />
                        </div>
                      </>
                    ) : (
                      /* Campos para gasto sem obra */
                      <>
                        <div className="quick-form-group">
                          <label>Origem/Destino *</label>
                          <input
                            type="text"
                            placeholder="Ex: Fornecedor Material"
                            value={form.origem}
                            onChange={(e) => setForm({ ...form, origem: e.target.value })}
                            className="quick-input"
                          />
                        </div>

                        <div className="quick-form-group">
                          <label>Categoria</label>
                          <input
                            type="text"
                            placeholder="Ex: Material, Mão de Obra"
                            value={form.categoria}
                            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                            className="quick-input"
                          />
                        </div>

                        <div className="quick-form-group">
                          <label>Observação</label>
                          <textarea
                            placeholder="Adicione detalhes..."
                            value={form.observacao}
                            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                            className="quick-textarea"
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ENTRADA */}
                {tipoTransacao === 'entrada' && (
                  <>
                    <div className="quick-form-group">
                      <label>Origem/Destino *</label>
                      <input
                        type="text"
                        placeholder="Ex: Pagamento Cliente"
                        value={form.origem}
                        onChange={(e) => setForm({ ...form, origem: e.target.value })}
                        className="quick-input"
                      />
                    </div>

                    <div className="quick-form-group">
                      <label>Categoria</label>
                      <input
                        type="text"
                        placeholder="Ex: Receita de Serviços"
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        className="quick-input"
                      />
                    </div>

                    <div className="quick-form-group">
                      <label>Observação</label>
                      <textarea
                        placeholder="Adicione detalhes..."
                        value={form.observacao}
                        onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                        className="quick-textarea"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Ações */}
              <div className="quick-modal-actions">
                <button
                  className="quick-btn-cancel"
                  onClick={() => setIsExpanded(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className={`quick-btn-submit ${tipoTransacao}`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="quick-spinner" />
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Registrar {tipoTransacao === 'entrada' ? 'Entrada' : 'Saída'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
