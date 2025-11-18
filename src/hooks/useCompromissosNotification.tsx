import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Calendar, Clock, MapPin, User, AlertCircle, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './useCompromissosNotification.css';

interface Compromisso {
  id: string;
  titulo: string;
  descricao: string | null;
  data_compromisso: string;
  cliente: string | null;
  local: string | null;
  notificado: boolean;
  concluido: boolean;
}

interface Divida {
  id: string;
  nome: string;
  valor: number;
  vencimento: string;
  status: 'em_dia' | 'atrasado' | 'quitado';
  categoria?: string;
  instituicao?: string;
  tipo?: 'normal' | 'parcelada';
  valorRestante?: number;
}

export function useCompromissosNotification() {
  const [compromissosProximos, setCompromissosProximos] = useState<Compromisso[]>([]);
  const [dividasAtrasadas, setDividasAtrasadas] = useState<Divida[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== useCompromissosNotification INICIADO (apenas ao carregar) ===' );
    checkCompromissos();
    checkDividas();
  }, []);

  const checkDividas = async () => {
    try {
      console.log('\n=== VERIFICANDO PARCELAS DE DÍVIDAS ===');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataHoje = hoje.toISOString().split('T')[0];
      
      // Adicionar 5 dias para alertar com antecedência
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + 5);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      console.log('Data de hoje:', dataHoje);
      console.log('Data limite (hoje + 5 dias):', dataLimiteStr);
      
      // Buscar TODAS as dívidas parceladas não quitadas
      const { data: todasDividas, error: erroTodas } = await supabase
        .from('dividas')
        .select('*')
        .eq('tipo', 'parcelada')
        .neq('status', 'quitado');
      
      console.log('Dívidas parceladas não quitadas:', todasDividas?.length || 0);
      
      const parcelasParaNotificar: Divida[] = [];
      
      if (todasDividas && todasDividas.length > 0) {
        console.log('\n📋 ANALISANDO PARCELAS:');
        
        todasDividas.forEach((divida) => {
          const datasParcelas = divida.datasParcelas || [];
          const parcelasPagas = divida.parcelasPagas || [];
          
          datasParcelas.forEach((dataParcela: string, idx: number) => {
            const isPaga = parcelasPagas[idx];
            
            if (!isPaga && dataParcela <= dataLimiteStr) {
              const isVencida = dataParcela < dataHoje;
              console.log(`  ⚠️ Parcela ${idx + 1}/${datasParcelas.length} de "${divida.nome}"`);
              console.log(`     Data: ${dataParcela} | Valor: R$ ${divida.valorParcela}`);
              console.log(`     Status: ${isVencida ? '🔴 VENCIDA' : '🟡 VENCENDO EM BREVE'}`);
              
              parcelasParaNotificar.push({
                id: `${divida.id}_parcela_${idx}`,
                nome: `${divida.nome} (Parcela ${idx + 1}/${datasParcelas.length})`,
                valor: divida.valorParcela || 0,
                vencimento: dataParcela,
                status: isVencida ? 'atrasado' : 'em_dia',
                categoria: divida.categoria,
                tipo: 'parcelada'
              });
            }
          });
        });
      }

      const data = parcelasParaNotificar;

      console.log('\n✅ Total de parcelas para notificar:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('\n📝 RESUMO DAS PARCELAS:');
        data.forEach((p, i) => {
          const dias = Math.floor((new Date(p.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          const statusMsg = dias < 0 ? `VENCIDA há ${Math.abs(dias)} dias` : dias === 0 ? 'VENCE HOJE' : `Vence em ${dias} dias`;
          console.log(`  ${i + 1}. ${p.nome}`);
          console.log(`     💰 R$ ${p.valor.toFixed(2)} | 📅 ${p.vencimento} | ${statusMsg}`);
        });
        setDividasAtrasadas(data);
        console.log('\n✔️ Estado dividasAtrasadas atualizado com', data.length, 'parcelas');
        setShowDialog(true);
        console.log('✔️ showDialog definido como true');
      } else {
        console.log('⚠️ Nenhuma parcela vencida ou vencendo encontrada');
      }
      console.log('=== FIM VERIFICAÇÃO PARCELAS ===\n');
    } catch (error) {
      console.error('❌ Erro ao verificar dívidas:', error);
    }
  };

  const checkCompromissos = async () => {
    try {
      const hoje = new Date();
      const cincodiasDepois = new Date();
      cincodiasDepois.setDate(hoje.getDate() + 5);

      // Busca compromissos não concluídos nos próximos 5 dias
      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('concluido', false)
        .gte('data_compromisso', hoje.toISOString())
        .lte('data_compromisso', cincodiasDepois.toISOString())
        .order('data_compromisso', { ascending: true });

      if (error) {
        console.error('Erro ao buscar compromissos:', error);
        return;
      }

      if (data && data.length > 0) {
        setCompromissosProximos(data);
        if (!showDialog) {
          setShowDialog(true);
        }

        // Marcar como notificados
        const idsParaNotificar = data.filter(c => !c.notificado).map(c => c.id);
        if (idsParaNotificar.length > 0) {
          await supabase
            .from('compromissos')
            .update({ notificado: true })
            .in('id', idsParaNotificar);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar compromissos:', error);
    }
  };

  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const diasRestantes = (data: string) => {
    const hoje = new Date();
    const dataCompromisso = new Date(data);
    const diff = Math.ceil((dataCompromisso.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const diasAtrasado = (data: string) => {
    const hoje = new Date();
    const dataVencimento = new Date(data);
    const diff = Math.ceil((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const NotificationDialog = () => {
    const hasNotifications = compromissosProximos.length > 0 || dividasAtrasadas.length > 0;
    
    console.log('NotificationDialog - Show:', showDialog, 'Compromissos:', compromissosProximos.length, 'Dívidas:', dividasAtrasadas.length);
    
    if (!showDialog || !hasNotifications) return null;

    return (
      <AnimatePresence>
        <motion.div 
          className="ios-notification-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDialog(false)}
        >
          <motion.div 
            className="ios-notification-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ios-notification-header">
              <div className="ios-notification-title-row">
                <AlertCircle className="ios-notification-icon" size={20} />
                <h2>Notificações</h2>
                <button 
                  className="ios-close-btn"
                  onClick={() => setShowDialog(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="ios-notification-content">
              {/* Dívidas Atrasadas */}
              {dividasAtrasadas.length > 0 && (
                <div className="ios-notification-section">
                  <div className="ios-section-header dividas-header">
                    <CreditCard size={16} />
                    <span>Dívidas em Atraso ({dividasAtrasadas.length})</span>
                  </div>
                  
                  {dividasAtrasadas.map(divida => {
                    const dias = diasAtrasado(divida.vencimento);
                    
                    return (
                      <motion.div 
                        key={divida.id} 
                        className="ios-notification-item divida-item"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="ios-item-badge divida-badge">
                          {dias} {dias === 1 ? 'dia' : 'dias'}
                        </div>
                        
                        <div className="ios-item-content">
                          <h3>{divida.nome}</h3>
                          <div className="ios-item-details">
                            <span className="divida-valor">{formatarValor(divida.valor)}</span>
                            <span className="divida-vencimento">
                              Venceu em {formatarData(divida.vencimento)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Compromissos Próximos */}
              {compromissosProximos.length > 0 && (
                <div className="ios-notification-section">
                  <div className="ios-section-header compromissos-header">
                    <Calendar size={16} />
                    <span>Compromissos Próximos ({compromissosProximos.length})</span>
                  </div>
                  
                  {compromissosProximos.map(compromisso => {
                    const dias = diasRestantes(compromisso.data_compromisso);
                    
                    return (
                      <motion.div 
                        key={compromisso.id} 
                        className="ios-notification-item compromisso-item"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="ios-item-badge compromisso-badge">
                          {dias === 0 ? 'HOJE' : `${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                        </div>
                        
                        <div className="ios-item-content">
                          <h3>{compromisso.titulo}</h3>
                          
                          <div className="ios-item-details">
                            <div className="ios-detail-row">
                              <Clock size={12} />
                              <span>{formatarData(compromisso.data_compromisso)}</span>
                            </div>
                            
                            {compromisso.cliente && (
                              <div className="ios-detail-row">
                                <User size={12} />
                                <span>{compromisso.cliente}</span>
                              </div>
                            )}
                            
                            {compromisso.local && (
                              <div className="ios-detail-row">
                                <MapPin size={12} />
                                <span>{compromisso.local}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="ios-notification-footer">
              <motion.button 
                className="ios-btn ios-btn-secondary"
                onClick={() => setShowDialog(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Fechar
              </motion.button>
              
              {dividasAtrasadas.length > 0 && (
                <motion.button 
                  className="ios-btn ios-btn-primary divida-btn"
                  onClick={() => {
                    setShowDialog(false);
                    navigate('/dividas');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Dívidas
                </motion.button>
              )}
              
              {compromissosProximos.length > 0 && (
                <motion.button 
                  className="ios-btn ios-btn-primary compromisso-btn"
                  onClick={() => {
                    setShowDialog(false);
                    navigate('/calendario');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Calendário
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return { NotificationDialog };
}
