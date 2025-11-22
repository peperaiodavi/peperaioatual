import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Typography, 
  Avatar, 
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import { supabase } from '../utils/supabaseClient';
import { PEPIA_ENDPOINTS } from '../config/api';

interface Message {
  role: 'user' | 'ia';
  content: string;
  isEscopo?: boolean;
}

export default function PepIAChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [escopoSelecionado, setEscopoSelecionado] = useState<string>('');
  const [nomeTemplate, setNomeTemplate] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const detectarEscopo = (texto: string): boolean => {
    const keywords = ['escopo', 'fornecimento', 'instalação', 'especificações técnicas', 'garantia', 'prazo'];
    const textoLower = texto.toLowerCase();
    return keywords.some(kw => textoLower.includes(kw)) && texto.length > 150;
  };

  const salvarComoTemplate = async () => {
    if (!user || !nomeTemplate.trim() || !tipoMaterial.trim()) return;

    try {
      const { error } = await supabase.from('templates_escopo').insert({
        nome: nomeTemplate,
        tipo_material: tipoMaterial,
        caracteristicas: [],
        peculiaridades: '',
        escopo_base: escopoSelecionado,
        usuario_id: user.id
      });

      if (!error) {
        alert('✅ Escopo salvo como template com sucesso!');
        setDialogAberto(false);
        setNomeTemplate('');
        setTipoMaterial('');
      }
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      alert('❌ Erro ao salvar template');
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setInput('');
    setLoading(true);

    const allMessagesToSend = [
      ...messages.map(m => ({ role: m.role, content: m.content } as Message)),
      userMsg
    ];

    try {
      const response = await fetch(PEPIA_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          messages: allMessagesToSend
        })
      });
      const data = await response.json();
      const iaMsg: Message = { 
        role: 'ia', 
        content: data.answer,
        isEscopo: detectarEscopo(data.answer)
      };
      setMessages((msgs) => [...msgs, userMsg, iaMsg]);
    } catch {
      setMessages((msgs) => [...msgs, userMsg, { role: 'ia', content: 'Erro ao conectar com a IA.' }]);
    }
    setLoading(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
      <Paper 
        elevation={0}
        sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #f8f9fa, #fff)',
          borderRadius: 3,
          border: '1px solid #e0e0e0'
        }}
      >
        <Box 
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: { xs: 2, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}>
              <SmartToyIcon sx={{ fontSize: 64, color: '#007AFF', opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary">Converse com a pepIA</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                Faça perguntas sobre suas finanças, obras, propostas e muito mais!
              </Typography>
            </Box>
          )}

          {messages.map((msg, i) => (
            <Box 
              key={i}
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 32, md: 36 }, 
                  height: { xs: 32, md: 36 },
                  bgcolor: msg.role === 'user' ? '#007AFF' : '#FFD600'
                }}
              >
                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" sx={{ color: '#222' }} />}
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  maxWidth: { xs: '75%', md: '60%' },
                  p: { xs: 1.5, md: 2 },
                  bgcolor: msg.role === 'user' ? '#007AFF' : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  borderRadius: 2.5,
                  wordWrap: 'break-word',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  {msg.content}
                </Typography>
                
                {/* Botão para salvar como template */}
                {msg.role === 'ia' && msg.isEscopo && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      icon={<SaveIcon />}
                      label="Salvar como Template"
                      size="small"
                      onClick={() => {
                        setEscopoSelecionado(msg.content);
                        setDialogAberto(true);
                      }}
                      sx={{ 
                        bgcolor: '#007AFF',
                        color: '#fff',
                        '&:hover': { bgcolor: '#0051D5' },
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#FFD600' }}>
                <SmartToyIcon fontSize="small" sx={{ color: '#222' }} />
              </Avatar>
              <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                <CircularProgress size={8} />
                <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                <CircularProgress size={8} sx={{ animationDelay: '0.4s' }} />
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box 
          component="form"
          onSubmit={sendMessage}
          sx={{ 
            p: { xs: 1.5, md: 2 }, 
            borderTop: '1px solid #e0e0e0',
            bgcolor: '#fff',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={loading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#f8f9fa',
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />
          <IconButton 
            type="submit"
            disabled={loading || !input.trim()}
            sx={{ 
              bgcolor: '#007AFF',
              color: '#fff',
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              '&:hover': { bgcolor: '#0051D5' },
              '&:disabled': { bgcolor: '#e0e0e0' }
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* Dialog para salvar como template */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#007AFF', color: '#fff' }}>
          💾 Salvar Escopo como Template
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Este escopo será salvo na aba <strong>Automação PDF</strong> e poderá ser reutilizado para outros clientes.
          </Typography>
          <TextField
            fullWidth
            label="Nome do Template"
            value={nomeTemplate}
            onChange={(e) => setNomeTemplate(e.target.value)}
            placeholder="Ex: Portão Alumínio Premium"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Tipo de Material/Produto"
            value={tipoMaterial}
            onChange={(e) => setTipoMaterial(e.target.value)}
            placeholder="Ex: Portão de Alumínio"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={salvarComoTemplate}
            disabled={!nomeTemplate.trim() || !tipoMaterial.trim()}
            sx={{ bgcolor: '#007AFF', '&:hover': { bgcolor: '#0051D5' } }}
          >
            Salvar Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
