import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import './CompromissosWidget.css';

interface Compromisso {
  id: string;
  titulo: string;
  descricao: string | null;
  data_compromisso: string;
  cliente: string | null;
  local: string | null;
  concluido: boolean;
}

export default function CompromissosWidget() {
  const navigate = useNavigate();
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompromissos();
  }, []);

  const loadCompromissos = async () => {
    try {
      const hoje = new Date();
      
      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('concluido', false)
        .gte('data_compromisso', hoje.toISOString())
        .order('data_compromisso', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Erro ao carregar compromissos:', error);
      } else {
        setCompromissos(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    const d = new Date(data);
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    // Reset time to compare only dates
    hoje.setHours(0, 0, 0, 0);
    amanha.setHours(0, 0, 0, 0);
    const dataCompromisso = new Date(d);
    dataCompromisso.setHours(0, 0, 0, 0);

    if (dataCompromisso.getTime() === hoje.getTime()) {
      return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dataCompromisso.getTime() === amanha.getTime()) {
      return `Amanhã, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const diasRestantes = (data: string) => {
    const hoje = new Date();
    const dataCompromisso = new Date(data);
    const diff = Math.ceil((dataCompromisso.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="compromissos-widget">
        <div className="compromissos-widget-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (compromissos.length === 0) {
    return null; // Não mostrar o widget se não há compromissos
  }

  return (
    <div className="compromissos-widget">
      <div className="compromissos-widget-header">
        <div className="compromissos-widget-icon">
          <Calendar size={20} />
        </div>
        <div>
          <h3>Próximos Compromissos</h3>
          <p>{compromissos.length} {compromissos.length === 1 ? 'agendado' : 'agendados'}</p>
        </div>
        <button 
          className="compromissos-widget-see-all"
          onClick={() => navigate('/calendario')}
        >
          Ver todos
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="compromissos-widget-list">
        {compromissos.map(compromisso => {
          const dias = diasRestantes(compromisso.data_compromisso);
          const isUrgente = dias <= 2;
          
          return (
            <div 
              key={compromisso.id} 
              className={`compromisso-widget-item ${isUrgente ? 'urgente' : ''}`}
              onClick={() => navigate('/calendario')}
            >
              <div className="compromisso-widget-date">
                <Clock size={14} />
                <span>{formatarData(compromisso.data_compromisso)}</span>
                {isUrgente && (
                  <div className="compromisso-badge-urgente">
                    <AlertCircle size={12} />
                    Urgente
                  </div>
                )}
              </div>
              
              <h4>{compromisso.titulo}</h4>
              
              <div className="compromisso-widget-details">
                {compromisso.cliente && (
                  <div className="compromisso-detail">
                    <User size={12} />
                    <span>{compromisso.cliente}</span>
                  </div>
                )}
                {compromisso.local && (
                  <div className="compromisso-detail">
                    <MapPin size={12} />
                    <span>{compromisso.local}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
