import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import type { CardDeObra } from '../../types/financeiro';

interface TransferirVerbaModalProps {
  card: CardDeObra;
  onClose: () => void;
  onTransferir: (valor: number) => Promise<void>;
}

export const TransferirVerbaModal: React.FC<TransferirVerbaModalProps> = ({
  card,
  onClose,
  onTransferir
}) => {
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      alert('Insira um valor válido');
      return;
    }

    try {
      setLoading(true);
      await onTransferir(valorNum);
      onClose();
    } catch (error) {
      console.error('Erro ao transferir:', error);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transferir Verba</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-section">
            <h3>{card.titulo}</h3>
            <p>{card.nome_cliente}</p>
            <div className="saldo-info">
              <span>Saldo Atual:</span>
              <strong>{formatarMoeda(card.saldo_atual)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Valor a Transferir</label>
              <div className="input-with-icon">
                <DollarSign size={18} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="alert-info">
              <p>Esta verba será:</p>
              <ul>
                <li>✓ Adicionada ao saldo do card</li>
                <li>✓ Registrada como saída no caixa</li>
                <li>✓ Descontada do orçamento da obra</li>
              </ul>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Transferindo...' : 'Transferir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
