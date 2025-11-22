import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField,
  Alert,
  LinearProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PEPIA_ENDPOINTS } from '../config/api';

interface TemplateEscopo {
  id: string;
  nome: string;
  tipo_material: string;
  caracteristicas: string[];
  peculiaridades: string;
  escopo_base: string;
}

interface GeracaoEscopo {
  cliente: string;
  tipo_material: string;
  escopo_gerado: string;
}

export default function PepIAAutomacaoPDF() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateEscopo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estados para criar template
  const [dialogAberto, setDialogAberto] = useState(false);
  const [nomeTemplate, setNomeTemplate] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [caracteristicas, setCaracteristicas] = useState<string[]>(['']);
  const [peculiaridades, setPeculiaridades] = useState('');
  const [escopoBase, setEscopoBase] = useState('');
  
  // Estados para gerar escopo
  const [dialogGeracao, setDialogGeracao] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [materialSelecionado, setMaterialSelecionado] = useState('');
  const [escopoGerado, setEscopoGerado] = useState('');
  const [gerandoEscopo, setGerandoEscopo] = useState(false);

  useEffect(() => {
    if (user) carregarTemplates();
  }, [user]);

  const carregarTemplates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates_escopo')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
    setLoading(false);
  };

  const salvarTemplate = async () => {
    if (!user || !nomeTemplate || !tipoMaterial || !escopoBase) {
      setMessage('⚠️ Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('templates_escopo')
        .insert({
          nome: nomeTemplate,
          tipo_material: tipoMaterial,
          caracteristicas: caracteristicas.filter(c => c.trim()),
          peculiaridades,
          escopo_base: escopoBase,
          usuario_id: user.id
        });

      if (error) throw error;

      setMessage('✅ Template salvo com sucesso!');
      setDialogAberto(false);
      limparFormulario();
      carregarTemplates();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao salvar template.');
    }
    setLoading(false);
  };

  const gerarEscopoComIA = async () => {
    if (!nomeCliente || !materialSelecionado) {
      setMessage('⚠️ Informe o cliente e selecione um material');
      return;
    }

    const template = templates.find(t => t.tipo_material === materialSelecionado);
    if (!template) {
      setMessage('❌ Template não encontrado');
      return;
    }

    setGerandoEscopo(true);
    try {
      // Chamar backend para gerar escopo com IA (aprenderá com propostas existentes)
      const response = await fetch(PEPIA_ENDPOINTS.gerarEscopo, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: nomeCliente,
          userId: user?.id, // Enviar userId para filtrar propostas se necessário
          template: {
            tipo_material: template.tipo_material,
            caracteristicas: template.caracteristicas,
            peculiaridades: template.peculiaridades,
            escopo_base: template.escopo_base
          }
        })
      });

      const data = await response.json();
      setEscopoGerado(data.escopo);
      setMessage('✅ Escopo gerado com sucesso!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao gerar escopo.');
    }
    setGerandoEscopo(false);
  };

  const copiarEscopo = () => {
    navigator.clipboard.writeText(escopoGerado);
    setMessage('📋 Escopo copiado para área de transferência!');
    setTimeout(() => setMessage(''), 3000);
  };

  const limparFormulario = () => {
    setNomeTemplate('');
    setTipoMaterial('');
    setCaracteristicas(['']);
    setPeculiaridades('');
    setEscopoBase('');
  };

  const adicionarCaracteristica = () => {
    setCaracteristicas([...caracteristicas, '']);
  };

  const atualizarCaracteristica = (index: number, valor: string) => {
    const novas = [...caracteristicas];
    novas[index] = valor;
    setCaracteristicas(novas);
  };

  const removerCaracteristica = (index: number) => {
    setCaracteristicas(caracteristicas.filter((_, i) => i !== index));
  };

  const excluirTemplate = async (id: string) => {
    if (!confirm('Deseja realmente excluir este template?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('templates_escopo')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('✅ Template excluído!');
      carregarTemplates();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao excluir template.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
        Automação de PDF com IA
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        Ensine a IA sobre escopos de materiais e gere propostas automaticamente
      </Typography>

      {message && (
        <Alert 
          severity={message.includes('❌') || message.includes('⚠️') ? 'error' : message.includes('✅') ? 'success' : 'info'} 
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* BOTÕES PRINCIPAIS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setDialogAberto(true)}
            sx={{ py: 1.5, bgcolor: '#1976d2' }}
          >
            Criar Novo Template
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setDialogGeracao(true)}
            sx={{ py: 1.5, bgcolor: '#2E7D32' }}
            disabled={templates.length === 0}
          >
            Gerar Escopo com IA
          </Button>
        </Grid>
      </Grid>

      {/* LISTA DE TEMPLATES */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
        📚 Templates Cadastrados ({templates.length})
      </Typography>

      {templates.length === 0 ? (
        <Alert severity="info">
          Nenhum template cadastrado ainda. Crie seu primeiro template para começar!
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card sx={{ boxShadow: 2, border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {template.nome}
                      </Typography>
                      <Chip 
                        label={template.tipo_material} 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => excluirTemplate(template.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Características:
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {template.caracteristicas.map((car, idx) => (
                      <Chip 
                        key={idx} 
                        label={car} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>

                  {template.peculiaridades && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Peculiaridades:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.peculiaridades}
                      </Typography>
                    </>
                  )}

                  <Accordion sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Ver Escopo Base
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          bgcolor: '#f5f5f5', 
                          p: 2, 
                          borderRadius: 1, 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: 12
                        }}
                      >
                        {template.escopo_base}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* DIALOG: CRIAR TEMPLATE */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff' }}>
          <AddCircleOutlineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Criar Novo Template de Escopo
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nome do Template"
            value={nomeTemplate}
            onChange={(e) => setNomeTemplate(e.target.value)}
            placeholder="Ex: Portão de Ferro Residencial"
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Tipo de Material/Produto"
            value={tipoMaterial}
            onChange={(e) => setTipoMaterial(e.target.value)}
            placeholder="Ex: Portão, Janela, Cerca, Gradil..."
            sx={{ mb: 2 }}
            required
          />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Características Técnicas
          </Typography>
          {caracteristicas.map((car, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={car}
                onChange={(e) => atualizarCaracteristica(idx, e.target.value)}
                placeholder="Ex: Dimensões, Material, Acabamento..."
              />
              {caracteristicas.length > 1 && (
                <IconButton size="small" color="error" onClick={() => removerCaracteristica(idx)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button 
            size="small" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={adicionarCaracteristica}
            sx={{ mb: 2 }}
          >
            Adicionar Característica
          </Button>

          <TextField
            fullWidth
            label="Peculiaridades e Observações"
            value={peculiaridades}
            onChange={(e) => setPeculiaridades(e.target.value)}
            placeholder="Ex: Instalação inclui dobradiças, fechadura com 3 chaves..."
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Escopo Base (Texto do PDF)"
            value={escopoBase}
            onChange={(e) => setEscopoBase(e.target.value)}
            placeholder="Digite o texto padrão que aparecerá na proposta. Use [CLIENTE] para inserir o nome do cliente automaticamente."
            multiline
            rows={6}
            sx={{ mb: 2 }}
            required
            helperText="A IA vai adaptar este texto com base no cliente e características"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={salvarTemplate}
            disabled={loading || !nomeTemplate || !tipoMaterial || !escopoBase}
          >
            Salvar Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: GERAR ESCOPO */}
      <Dialog open={dialogGeracao} onClose={() => setDialogGeracao(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2E7D32', color: '#fff' }}>
          <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gerar Escopo com IA
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nome do Cliente"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Ex: João Silva, Empresa XYZ..."
            sx={{ mb: 2 }}
            required
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Selecione o Material/Produto</InputLabel>
            <Select
              value={materialSelecionado}
              onChange={(e) => setMaterialSelecionado(e.target.value)}
              label="Selecione o Material/Produto"
            >
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.tipo_material}>
                  {t.nome} ({t.tipo_material})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={gerarEscopoComIA}
            disabled={gerandoEscopo || !nomeCliente || !materialSelecionado}
            sx={{ mb: 2 }}
          >
            {gerandoEscopo ? 'Gerando com IA...' : 'Gerar Escopo Personalizado'}
          </Button>

          {gerandoEscopo && <LinearProgress sx={{ mb: 2 }} />}

          {escopoGerado && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Escopo Gerado:
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={copiarEscopo}
                >
                  Copiar
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={escopoGerado}
                onChange={(e) => setEscopoGerado(e.target.value)}
                sx={{ 
                  '& .MuiInputBase-root': { 
                    bgcolor: '#f5f5f5',
                    fontFamily: 'monospace',
                    fontSize: 13
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogGeracao(false);
            setEscopoGerado('');
            setNomeCliente('');
            setMaterialSelecionado('');
          }}>
            Fechar
          </Button>
          {escopoGerado && (
            <Button 
              variant="contained" 
              startIcon={<PictureAsPdfIcon />}
              color="error"
            >
              Exportar PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
