import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAuth } from '../context/AuthContext';

interface Tarefa {
  id: string;
  titulo: string;
  tipo: 'relatorio' | 'alerta' | 'backup' | 'notificacao';
  frequencia: 'diaria' | 'semanal' | 'mensal';
  ativa: boolean;
}

export default function PepIATarefas() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', tipo: 'relatorio', frequencia: 'diaria' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const adicionarTarefa = async () => {
    if (!novaTarefa.titulo.trim()) return;
    setLoading(true);
    try {
      // Aqui você conectaria ao backend para salvar a tarefa
      const novaTarefaObj: Tarefa = {
        id: Date.now().toString(),
        titulo: novaTarefa.titulo,
        tipo: novaTarefa.tipo as any,
        frequencia: novaTarefa.frequencia as any,
        ativa: true
      };
      setTarefas([...tarefas, novaTarefaObj]);
      setNovaTarefa({ titulo: '', tipo: 'relatorio', frequencia: 'diaria' });
      setMessage('Tarefa adicionada com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Erro ao adicionar tarefa.');
    }
    setLoading(false);
  };

  const removerTarefa = (id: string) => {
    setTarefas(tarefas.filter(t => t.id !== id));
    setMessage('Tarefa removida com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  const executarTarefa = (id: string) => {
    setMessage(`Executando tarefa...`);
    setTimeout(() => setMessage('Tarefa executada com sucesso!'), 2000);
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
        Automatizar Tarefas
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        Configure tarefas automáticas para executar periodicamente no sistema.
      </Typography>

      {message && (
        <Alert severity={message.includes('Erro') ? 'error' : 'success'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Nova Tarefa
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título da Tarefa"
              variant="outlined"
              fullWidth
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              placeholder="Ex: Enviar relatório semanal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={novaTarefa.tipo}
                  label="Tipo"
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, tipo: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="relatorio">Relatório</MenuItem>
                  <MenuItem value="alerta">Alerta</MenuItem>
                  <MenuItem value="backup">Backup</MenuItem>
                  <MenuItem value="notificacao">Notificação</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Frequência</InputLabel>
                <Select
                  value={novaTarefa.frequencia}
                  label="Frequência"
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, frequencia: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="diaria">Diária</MenuItem>
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="mensal">Mensal</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={adicionarTarefa}
              disabled={loading}
              sx={{ 
                bgcolor: '#007AFF', 
                '&:hover': { bgcolor: '#0051D5' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Adicionar Tarefa
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Tarefas Cadastradas ({tarefas.length})
      </Typography>

      {tarefas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
          <Typography>Nenhuma tarefa cadastrada ainda.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tarefas.map((tarefa) => (
            <Card key={tarefa.id} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {tarefa.titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={tarefa.tipo} size="small" color="primary" variant="outlined" />
                      <Chip label={tarefa.frequencia} size="small" color="secondary" variant="outlined" />
                      <Chip 
                        label={tarefa.ativa ? 'Ativa' : 'Inativa'} 
                        size="small" 
                        color={tarefa.ativa ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => executarTarefa(tarefa.id)}
                      title="Executar agora"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => removerTarefa(tarefa.id)}
                      title="Remover tarefa"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
