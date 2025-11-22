import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useSaldoCaixa() {
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const { data, error } = await supabase
          .from('transacoes')
          .select('tipo, valor')
          .order('data', { ascending: false });

        if (error) {
          console.error('Erro ao buscar transações:', error);
          return;
        }

        if (!data) {
          setSaldo(0);
          return;
        }

        // Calcular saldo exatamente como no Caixa.tsx
        const saldoCalculado = data.reduce((acc, t) => {
          return t.tipo === 'entrada' ? acc + t.valor : acc - t.valor;
        }, 0);

        setSaldo(saldoCalculado);
      } catch (err) {
        console.error('Erro ao calcular saldo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaldo();

    // Atualizar quando houver mudanças na tabela transacoes
    const subscription = supabase
      .channel('transacoes_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transacoes' 
      }, () => {
        fetchSaldo();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { saldo, loading };
}
