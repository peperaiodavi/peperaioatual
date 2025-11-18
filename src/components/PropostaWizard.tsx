import { useState, useMemo } from 'react';
import { Check, ChevronLeft, ChevronRight, User, FileText, DollarSign, Calendar, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import extenso from 'extenso';
import './PropostaWizard.css';

interface PriceItem {
  id: string;
  descricao: string;
  qtde: string;
  valor: string;
}

interface Proposta {
  id: string;
  cliente_nome: string;
  cliente_contato: string;
  cliente_cnpj?: string;
  cliente_endereco?: string;
  proposta_numero: string;
  numero_sequencial: number;
  numero_revisao: number;
  data_emissao: string;
  escopo_fornecimento: string;
  condicoes_pagamento: string;
  notas_tecnicas?: string;
  price_items: PriceItem[];
  valor_total_extenso: string;
  prazo_garantia_meses: string;
  data_base_proposta?: string;
  prazo_entrega?: string;
  finalizada: boolean;
  created_at: string;
}

interface PropostaWizardProps {
  proposta: Proposta;
  onSave: (proposta: Proposta) => void;
  onCancel: () => void;
}

const steps = [
  { id: 1, title: 'Cliente', icon: User },
  { id: 2, title: 'Escopo', icon: FileText },
  { id: 3, title: 'Pagamento', icon: DollarSign },
  { id: 4, title: 'Notas Técnicas', icon: Package },
  { id: 5, title: 'Preços', icon: DollarSign },
  { id: 6, title: 'Condições Gerais', icon: Calendar },
];

// Função para converter valor numérico para extenso
const converterValorParaExtenso = (valor: number): string => {
  try {
    if (valor === 0) return 'zero reais';
    const valorExtenso = extenso(valor, { mode: 'currency' });
    return valorExtenso;
  } catch (error) {
    console.error('Erro ao converter valor para extenso:', error);
    return `${valor.toFixed(2)} reais`;
  }
};

export default function PropostaWizard({ proposta, onSave, onCancel }: PropostaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [editedProposta, setEditedProposta] = useState<Proposta>(proposta);

  // Calcula o valor total automaticamente
  const valorTotalCalculado = useMemo(() => {
    return editedProposta.price_items.reduce((acc, item) => {
      const valorItem = parseFloat(item.valor || '0');
      const qtdeItem = parseInt(item.qtde || '1', 10);
      return acc + (valorItem * qtdeItem);
    }, 0);
  }, [editedProposta.price_items]);

  // Calcula o valor por extenso
  const valorTotalExtenso = useMemo(() => {
    return converterValorParaExtenso(valorTotalCalculado);
  }, [valorTotalCalculado]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Atualiza o valor por extenso antes de salvar
    const propostaAtualizada = {
      ...editedProposta,
      valor_total_extenso: valorTotalExtenso
    };
    onSave(propostaAtualizada);
  };

  const handleItemChange = (id: string, field: keyof PriceItem, value: string) => {
    setEditedProposta({
      ...editedProposta,
      price_items: editedProposta.price_items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleAddItem = () => {
    const newItem: PriceItem = {
      id: Date.now().toString(),
      descricao: 'Novo item',
      qtde: '1',
      valor: '0.00',
    };
    setEditedProposta({
      ...editedProposta,
      price_items: [...editedProposta.price_items, newItem]
    });
  };

  const handleRemoveItem = (id: string) => {
    setEditedProposta({
      ...editedProposta,
      price_items: editedProposta.price_items.filter(item => item.id !== id)
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <User />
              Informações do Cliente
            </h3>
            <div className="wizard-form-grid">
              <div className="wizard-form-field">
                <label>Nome do Cliente *</label>
                <Input
                  value={editedProposta.cliente_nome}
                  onChange={(e) => setEditedProposta({ ...editedProposta, cliente_nome: e.target.value })}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="wizard-form-field">
                <label>Contato *</label>
                <Input
                  value={editedProposta.cliente_contato}
                  onChange={(e) => setEditedProposta({ ...editedProposta, cliente_contato: e.target.value })}
                  placeholder="Nome do contato"
                />
              </div>
              <div className="wizard-form-field">
                <label>CNPJ (Opcional)</label>
                <Input
                  value={editedProposta.cliente_cnpj || ''}
                  onChange={(e) => setEditedProposta({ ...editedProposta, cliente_cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="wizard-form-field">
                <label>Endereço (Opcional)</label>
                <Input
                  value={editedProposta.cliente_endereco || ''}
                  onChange={(e) => setEditedProposta({ ...editedProposta, cliente_endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
            <div className="wizard-info-box">
              <p><strong>Número da Proposta:</strong> {editedProposta.proposta_numero}</p>
              <p><strong>Revisão Atual:</strong> R{editedProposta.numero_revisao.toString().padStart(2, '0')}</p>
              <p><strong>Próxima Revisão:</strong> R{(editedProposta.numero_revisao + 1).toString().padStart(2, '0')}</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <FileText />
              Escopo de Fornecimento
            </h3>
            <p className="wizard-description">
              💡 Use os botões do editor para formatar o texto com <strong>negrito</strong>, <em>itálico</em> e listas.
            </p>
            <div className="wizard-form-field">
              <ReactQuill
                value={editedProposta.escopo_fornecimento}
                onChange={(value) => setEditedProposta({ ...editedProposta, escopo_fornecimento: value })}
                modules={{
                  toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                  ]
                }}
                formats={['bold', 'italic', 'list', 'bullet']}
                placeholder="Descreva o escopo completo do fornecimento..."
                className="wizard-editor editor-escopo"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <DollarSign />
              Condições de Pagamento
            </h3>
            <p className="wizard-description">
              💡 Use os botões do editor para formatar o texto com <strong>negrito</strong>, <em>itálico</em> e listas.
            </p>
            <div className="wizard-form-field">
              <ReactQuill
                value={editedProposta.condicoes_pagamento}
                onChange={(value) => setEditedProposta({ ...editedProposta, condicoes_pagamento: value })}
                modules={{
                  toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                  ]
                }}
                formats={['bold', 'italic', 'list', 'bullet']}
                placeholder="Descreva as condições de pagamento..."
                className="wizard-editor editor-condicoes"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <Package />
              Notas Técnicas (Opcional)
            </h3>
            <p className="wizard-description">
              💡 Use os botões do editor para formatar o texto. Deixe vazio para usar o texto padrão.
            </p>
            <div className="wizard-form-field">
              <ReactQuill
                value={editedProposta.notas_tecnicas || ''}
                onChange={(value) => setEditedProposta({ ...editedProposta, notas_tecnicas: value })}
                modules={{
                  toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                  ]
                }}
                formats={['bold', 'italic', 'list', 'bullet']}
                placeholder="3.1 para elaboração consideramos as documentações técnicas..."
                className="wizard-editor editor-notas"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <DollarSign />
              Preços e Itens
            </h3>
            <div className="wizard-price-items">
              {editedProposta.price_items.map((item, index) => (
                <div key={item.id} className="wizard-price-item">
                  <div className="wizard-price-item-header">
                    <span className="wizard-price-item-label">Item {index + 1}</span>
                    {editedProposta.price_items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="wizard-price-item-remove"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="wizard-price-item-fields">
                    <div className="wizard-form-field">
                      <label>Descrição *</label>
                      <Input
                        value={item.descricao}
                        onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                        placeholder="Descrição do item"
                      />
                    </div>
                    <div className="wizard-form-field">
                      <label>Qtde *</label>
                      <Input
                        type="number"
                        value={item.qtde}
                        onChange={(e) => handleItemChange(item.id, 'qtde', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="wizard-form-field">
                      <label>Valor (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleAddItem} className="wizard-btn-add">
              + Adicionar Novo Item
            </button>
            <div className="wizard-total-box">
              <div className="wizard-total-row">
                <span className="wizard-total-label">VALOR TOTAL CALCULADO:</span>
                <span className="wizard-total-value">
                  {valorTotalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="wizard-total-extenso">
                Por extenso: <strong>{valorTotalExtenso}</strong>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="wizard-step-content">
            <h3 className="wizard-step-title">
              <Calendar />
              Condições Gerais
            </h3>
            <div className="wizard-form-grid">
              <div className="wizard-form-field">
                <label>Prazo de Garantia (meses) *</label>
                <Input
                  type="number"
                  value={editedProposta.prazo_garantia_meses}
                  onChange={(e) => setEditedProposta({ ...editedProposta, prazo_garantia_meses: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="wizard-form-field">
                <label>Data Base da Proposta *</label>
                <Input
                  type="date"
                  value={editedProposta.data_base_proposta || ''}
                  onChange={(e) => setEditedProposta({ ...editedProposta, data_base_proposta: e.target.value })}
                />
              </div>
              <div className="wizard-form-field">
                <label>Prazo de Entrega *</label>
                <Input
                  value={editedProposta.prazo_entrega || ''}
                  onChange={(e) => setEditedProposta({ ...editedProposta, prazo_entrega: e.target.value })}
                  placeholder="10 dias úteis"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      {/* Stepper */}
      <div className="wizard-stepper">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="wizard-step-wrapper">
              <div
                className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="wizard-step-circle">
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <span className="wizard-step-label">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`wizard-step-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="wizard-content">
        {renderStepContent()}
      </div>

      {/* Botões de Navegação */}
      <div className="wizard-actions">
        <Button
          variant="outline"
          onClick={onCancel}
          className="wizard-btn-cancel"
        >
          Cancelar
        </Button>
        
        <div className="wizard-navigation">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="wizard-btn-nav"
          >
            <ChevronLeft size={20} />
            Anterior
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              className="wizard-btn-nav wizard-btn-next"
            >
              Próximo
              <ChevronRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="wizard-btn-save"
            >
              <Check size={20} />
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
