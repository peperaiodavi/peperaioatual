/**
 * Exemplo de Componente Refatorado com TanStack Query
 * 
 * Este arquivo demonstra como refatorar um componente típico
 * do sistema para usar TanStack Query de forma otimizada.
 */

import { useState, useMemo } from 'react';
import { 
  useTransacoes, 
  useCreateTransacao, 
  useDeleteTransacao,
  useCategorias 
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatCurrency } from '../utils/formatCurrency';
import { usePermissao } from '../context/PermissaoContext';

export default function TransacoesExample() {
  const { canCreate, canDelete } = usePermissao();
  
  // ✅ Usando TanStack Query para buscar dados
  const { data: transacoes, isLoading, error, refetch } = useTransacoes();
  const { data: categorias } = useCategorias();
  
  // ✅ Usando mutations para operações de escrita
  const createTransacao = useCreateTransacao();
  const deleteTransacao = useDeleteTransacao();
  
  // Estado local apenas para UI (não dados do servidor)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: '',
    descricao: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
  });

  // ✅ Cálculos derivados com useMemo
  const saldoTotal = useMemo(() => {
    if (!transacoes) return 0;
    return transacoes.reduce((acc, t) => {
      return t.tipo === 'entrada' ? acc + t.valor : acc - t.valor;
    }, 0);
  }, [transacoes]);

  const totalEntradas = useMemo(() => {
    if (!transacoes) return 0;
    return transacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoes]);

  const totalSaidas = useMemo(() => {
    if (!transacoes) return 0;
    return transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoes]);

  // ✅ Handler de criação usando mutation
  const handleCreateTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTransacao.mutateAsync({
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        categoria: formData.categoria,
        data: formData.data,
      });
      
      // Reset form e fecha dialog
      setFormData({
        tipo: 'entrada',
        valor: '',
        descricao: '',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
      
      // Não precisa recarregar manualmente - TanStack Query invalida automaticamente!
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  // ✅ Handler de deleção usando mutation
  const handleDeleteTransacao = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;
    
    try {
      await deleteTransacao.mutateAsync(id);
      // Cache é invalidado automaticamente pela mutation
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Carregando transações...</p>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-red-500">Erro ao carregar transações</p>
        <Button onClick={() => refetch()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Saldo Total</h3>
          <p className="text-2xl font-bold">{formatCurrency(saldoTotal)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Entradas</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Saídas</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
        </div>
      </div>

      {/* Botão de adicionar */}
      {canCreate && (
        <div className="mb-4">
          <Button onClick={() => setIsDialogOpen(true)}>
            Nova Transação
          </Button>
        </div>
      )}

      {/* Lista de transações */}
      <div className="space-y-2">
        {transacoes?.map((transacao) => (
          <div
            key={transacao.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{transacao.descricao}</p>
              <p className="text-sm text-gray-500">
                {transacao.categoria} • {new Date(transacao.data).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p
                className={`text-lg font-bold ${
                  transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transacao.valor)}
              </p>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTransacao(transacao.id)}
                  disabled={deleteTransacao.isPending}
                >
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTransacao} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(value: string) => setFormData({ ...formData, tipo: value as 'entrada' | 'saida' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Valor</label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <Select
                value={formData.categoria}
                onValueChange={(value: string) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createTransacao.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createTransacao.isPending}>
                {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * BENEFÍCIOS DESTA IMPLEMENTAÇÃO:
 * 
 * 1. ✅ Cache Automático
 *    - Dados são armazenados em cache
 *    - Reduz requisições ao servidor
 *    - Melhora performance
 * 
 * 2. ✅ Loading States Gerenciados
 *    - isLoading, isPending automáticos
 *    - Não precisa de useState para loading
 * 
 * 3. ✅ Error Handling Consistente
 *    - Errors são capturados automaticamente
 *    - Toast notifications nos hooks
 * 
 * 4. ✅ Invalidação Inteligente
 *    - Cache é invalidado automaticamente após mutations
 *    - Dados sempre sincronizados
 * 
 * 5. ✅ Otimizações de Performance
 *    - useMemo para cálculos derivados
 *    - Re-renders minimizados
 * 
 * 6. ✅ Menos Código
 *    - ~50% menos código comparado à implementação tradicional
 *    - Mais legível e manutenível
 * 
 * 7. ✅ DevTools
 *    - Debug fácil com React Query DevTools
 *    - Ver estado do cache em tempo real
 */
