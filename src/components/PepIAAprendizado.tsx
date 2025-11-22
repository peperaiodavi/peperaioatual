import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ConhecimentoBase {
  categoria: string;
  perguntas: string[];
}

const CATEGORIAS_CONHECIMENTO: ConhecimentoBase[] = [
  {
    categoria: 'Processo de Obras',
    perguntas: [
      'Como você planeja uma obra? Descreva as etapas principais.',
      'Quais critérios você usa para aprovar ou reprovar uma proposta?',
      'Como você calcula o orçamento inicial de uma obra?',
      'Quais materiais você costuma usar com mais frequência?',
      'Como você gerencia prazos e entregas?'
    ]
  },
  {
    categoria: 'Gestão Financeira',
    perguntas: [
      'Qual a margem de lucro ideal para suas obras?',
      'Como você negocia pagamentos com clientes?',
      'Quais são suas principais categorias de despesas?',
      'Como você define prioridades de pagamento?',
      'Qual estratégia de precificação você adota?'
    ]
  },
  {
    categoria: 'Fornecedores e Materiais',
    perguntas: [
      'Quais são seus fornecedores preferenciais? Por quê?',
      'Como você avalia a qualidade de materiais?',
      'Quais materiais alternativos você conhece que são mais econômicos?',
      'Como você negocia preços com fornecedores?',
      'Quando você compra em grande quantidade vs pequena quantidade?'
    ]
  },
  {
    categoria: 'Equipe e Funcionários',
    perguntas: [
      'Como você avalia o desempenho dos funcionários?',
      'Quais habilidades são essenciais na sua equipe?',
      'Como você calcula diárias e remuneração?',
      'Como você distribui tarefas entre a equipe?',
      'Quais critérios usa para contratar novos funcionários?'
    ]
  },
  {
    categoria: 'Clientes e Relacionamento',
    perguntas: [
      'Como você identifica clientes em potencial?',
      'Como você lida com negociações de desconto?',
      'Quais tipos de obra você prefere fazer? Por quê?',
      'Como você garante satisfação do cliente?',
      'Como você lida com reclamações ou problemas?'
    ]
  }
];

export default function PepIAAprendizado() {
  const { user } = useAuth();
  const [categoriaAtual, setCategoriaAtual] = useState('');
  const [respostas, setRespostas] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progressoTotal, setProgressoTotal] = useState(0);
  const [textoManual, setTextoManual] = useState('');
  const [documentosAdicionados, setDocumentosAdicionados] = useState<string[]>([]);

  const salvarConhecimento = async (categoria: string, pergunta: string, resposta: string) => {
    if (!user || !resposta.trim()) return;
    
    setLoading(true);
    try {
      // Salvar no banco de dados vetorial
      const documento = `Categoria: ${categoria}\nPergunta: ${pergunta}\nResposta: ${resposta}`;
      
      const { error } = await supabase
        .from('documentos')
        .insert({
          conteudo: documento,
          tipo: 'conhecimento_base',
          categoria: categoria,
          usuario_id: user.id
        });

      if (error) throw error;

      setMessage(`✅ Conhecimento sobre "${categoria}" salvo com sucesso!`);
      setTimeout(() => setMessage(''), 5000);
      
      // Atualizar progresso
      const totalRespostas = Object.keys(respostas).filter(k => respostas[k].trim()).length + 1;
      const totalPerguntas = CATEGORIAS_CONHECIMENTO.reduce((acc, c) => acc + c.perguntas.length, 0);
      setProgressoTotal((totalRespostas / totalPerguntas) * 100);

    } catch (err) {
      console.error('Erro ao salvar conhecimento:', err);
      setMessage('❌ Erro ao salvar. Tente novamente.');
    }
    setLoading(false);
  };

  const salvarRespostas = async (categoria: string) => {
    const categoriaDados = CATEGORIAS_CONHECIMENTO.find(c => c.categoria === categoria);
    if (!categoriaDados) return;

    for (const pergunta of categoriaDados.perguntas) {
      const key = `${categoria}_${pergunta}`;
      if (respostas[key] && respostas[key].trim()) {
        await salvarConhecimento(categoria, pergunta, respostas[key]);
      }
    }
  };

  const adicionarDocumentoManual = async () => {
    if (!textoManual.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('documentos')
        .insert({
          conteudo: textoManual,
          tipo: 'documento_manual',
          categoria: 'Manual',
          usuario_id: user.id
        });

      if (error) throw error;
      setDocumentosAdicionados([...documentosAdicionados, textoManual.substring(0, 50) + '...']);
      setTextoManual('');
      setMessage('✅ Documento adicionado com sucesso!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao adicionar documento.');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const texto = event.target?.result as string;
      try {
        const { error } = await supabase
          .from('documentos')
          .insert({
            conteudo: texto,
            tipo: 'arquivo_upload',
            categoria: 'Arquivo',
            usuario_id: user.id
          });
        
        if (error) throw error;
        setDocumentosAdicionados([...documentosAdicionados, file.name]);
        setMessage(`✅ Arquivo "${file.name}" processado com sucesso!`);
        setTimeout(() => setMessage(''), 5000);
      } catch (err) {
        console.error(err);
        setMessage('❌ Erro ao processar arquivo.');
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
        Aprendizado Contínuo
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        Ensine a IA sobre seu negócio respondendo perguntas estratégicas. Quanto mais você ensinar, mais inteligente ela fica!
      </Typography>

      {message && (
        <Alert 
          severity={message.includes('Erro') || message.includes('❌') ? 'error' : 'success'} 
          sx={{ mb: 3 }}
          icon={message.includes('✅') ? <CheckCircleIcon /> : undefined}
        >
          {message}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* PROGRESSO GERAL */}
      <Card sx={{ mb: 3, bgcolor: '#F5F5F5', boxShadow: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            📈 Progresso do Treinamento: {progressoTotal.toFixed(0)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressoTotal} 
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Responda as perguntas abaixo para aumentar a inteligência da IA
          </Typography>
        </CardContent>
      </Card>

      {/* CATEGORIAS DE CONHECIMENTO */}
      <Grid container spacing={2}>
        {CATEGORIAS_CONHECIMENTO.map((cat, idx) => (
          <Grid item xs={12} key={idx}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {cat.categoria === 'Processo de Obras' && <EngineeringIcon color="primary" />}
                  {cat.categoria === 'Gestão Financeira' && <AttachMoneyIcon sx={{ color: '#2E7D32' }} />}
                  {cat.categoria === 'Fornecedores e Materiais' && <DescriptionIcon sx={{ color: '#F57C00' }} />}
                  {cat.categoria === 'Equipe e Funcionários' && <PeopleIcon sx={{ color: '#1565C0' }} />}
                  {cat.categoria === 'Clientes e Relacionamento' && <CheckCircleIcon sx={{ color: '#6A1B9A' }} />}
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {cat.categoria}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat.perguntas.length} perguntas
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={`${cat.perguntas.filter(p => respostas[`${cat.categoria}_${p}`]?.trim()).length}/${cat.perguntas.length}`}
                    size="small"
                    color={cat.perguntas.filter(p => respostas[`${cat.categoria}_${p}`]?.trim()).length === cat.perguntas.length ? 'success' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {cat.perguntas.map((pergunta, pIdx) => {
                    const key = `${cat.categoria}_${pergunta}`;
                    return (
                      <React.Fragment key={pIdx}>
                        <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#555' }}>
                            {pIdx + 1}. {pergunta}
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Digite sua resposta aqui..."
                            value={respostas[key] || ''}
                            onChange={(e) => setRespostas({ ...respostas, [key]: e.target.value })}
                            variant="outlined"
                            size="small"
                            sx={{ bgcolor: '#fff' }}
                          />
                        </ListItem>
                        {pIdx < cat.perguntas.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => salvarRespostas(cat.categoria)}
                    disabled={loading || !cat.perguntas.some(p => respostas[`${cat.categoria}_${p}`]?.trim())}
                  >
                    Salvar Respostas desta Categoria
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* INFORMAÇÕES ADICIONAIS */}
      <Card sx={{ mt: 3, bgcolor: '#E3F2FD', boxShadow: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1565C0', mb: 1 }}>
            💡 Dica: Como a IA usa essas informações?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • No <strong>Chat</strong>: Respostas personalizadas baseadas no seu processo de trabalho<br/>
            • No <strong>Monitoramento</strong>: Alertas alinhados com suas prioridades<br/>
            • Na <strong>Análise de Obras</strong>: Recomendações customizadas para seu negócio<br/>
            • Nas <strong>Ações Automáticas</strong>: Decisões inteligentes baseadas nas suas preferências
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3, mt: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Adicionar Texto Manual
          </Typography>
          <TextField
            label="Cole ou digite o texto aqui"
            variant="outlined"
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            value={textoManual}
            onChange={(e) => setTextoManual(e.target.value)}
            placeholder="Ex: Nossa empresa atende das 8h às 18h. Oferecemos garantia de 1 ano em todos os serviços..."
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={adicionarDocumentoManual}
            disabled={loading || !textoManual.trim()}
            sx={{ 
              bgcolor: '#007AFF', 
              '&:hover': { bgcolor: '#0051D5' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Adicionar ao Conhecimento
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Importar Arquivo
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Envie arquivos de texto (.txt, .md) para processar automaticamente.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={loading}
            sx={{ 
              borderColor: '#007AFF',
              color: '#007AFF',
              '&:hover': { borderColor: '#0051D5', bgcolor: 'rgba(0, 122, 255, 0.04)' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Selecionar Arquivo
            <input
              type="file"
              hidden
              accept=".txt,.md"
              onChange={handleFileUpload}
            />
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Documentos Adicionados ({documentosAdicionados.length})
          </Typography>
          {documentosAdicionados.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum documento adicionado ainda.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {documentosAdicionados.map((doc, idx) => (
                <Chip 
                  key={idx} 
                  label={doc} 
                  color="success" 
                  variant="outlined"
                  icon={<CheckCircleIcon />}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
