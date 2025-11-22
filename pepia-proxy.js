require('dotenv').config();
process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', function (err) {
  console.error('Unhandled Rejection:', err);
});

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());


// Importa funções do serviço RAG

const { gerarEmbedding, buscarDocumentosSimilares } = require('./pepia-rag-service');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.post('/api/pepia', async (req, res) => {
  const { userId, messages } = req.body;
  if (!userId || !messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ answer: 'userId e messages são obrigatórios.' });
  }

  try {
    // Buscar TODAS as tabelas do sistema SEM FILTRO (usuario_id não existe nas tabelas)
    const { data: obras } = await supabase.from('obras').select('*');
    const { data: propostas } = await supabase.from('propostas').select('*');
    const { data: transacoes } = await supabase.from('transacoes').select('*').order('created_at', { ascending: false }).limit(100);
    const { data: compromissos } = await supabase.from('compromissos').select('*');
    const { data: funcionarios } = await supabase.from('funcionarios').select('*');
    const { data: dividas } = await supabase.from('dividas').select('*');
    const { data: gastos } = await supabase.from('gastos_obra').select('*');
    const { data: diarias } = await supabase.from('diarias').select('*');
    
    // CALCULAR SALDO REAL DO CAIXA (mesma lógica do Caixa.tsx)
    const saldoCaixa = transacoes?.reduce((acc, t) => {
      return t.tipo === 'entrada' ? acc + parseFloat(t.valor || 0) : acc - parseFloat(t.valor || 0);
    }, 0) || 0;

    // Calcular totais financeiros REAIS
    const totalReceitas = transacoes?.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0) || 0;
    const totalDespesas = transacoes?.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0) || 0;
    const totalGastos = gastos?.reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0) || 0;
    
    // Agrupar gastos por categoria
    const gastosPorCategoria = {};
    gastos?.forEach(g => {
      const cat = g.categoria || 'Sem Categoria';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (parseFloat(g.valor) || 0);
    });
    const top5Gastos = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`);
    
    // Análise de obras (margem de lucro)
    const obrasComAnalise = obras?.map(o => {
      const gastosObra = gastos?.filter(g => g.obra_id === o.id) || [];
      const totalGastosObra = gastosObra.reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0);
      const orcamento = parseFloat(o.orcamento) || 0;
      const valorRecebido = parseFloat(o.valor_recebido) || 0;
      const lucro = valorRecebido - totalGastosObra;
      const margem = orcamento > 0 ? ((lucro / orcamento) * 100) : 0;
      return {
        nome: o.nome,
        orcamento,
        gastos: totalGastosObra,
        recebido: valorRecebido,
        lucro,
        margem: margem.toFixed(1) + '%',
        status: o.finalizada ? 'Finalizada' : 'Ativa'
      };
    }) || [];
    
    const contextoDinamico = `
      === RESUMO FINANCEIRO COMPLETO ===
      💰 SALDO ATUAL DO CAIXA: R$ ${saldoCaixa.toFixed(2)}
      📈 Total de Receitas (entradas): R$ ${totalReceitas.toFixed(2)}
      📉 Total de Despesas (saídas): R$ ${totalDespesas.toFixed(2)}
      🔧 Total de Gastos em Obras: R$ ${totalGastos.toFixed(2)}
      
      TOP 5 CATEGORIAS DE GASTOS:
      ${top5Gastos.join('\n      ') || 'Nenhum gasto categorizado'}
      
      === OBRAS (${obras?.length || 0} total) ===
      ${obrasComAnalise.slice(0, 10).map(o => 
        `- ${o.nome} (${o.status}):
           Orçamento: R$ ${o.orcamento.toFixed(2)}
           Gastos: R$ ${o.gastos.toFixed(2)}
           Recebido: R$ ${o.recebido.toFixed(2)}
           Lucro: R$ ${o.lucro.toFixed(2)}
           Margem: ${o.margem}`
      ).join('\n      ') || 'Nenhuma obra cadastrada'}
      
      === PROPOSTAS (${propostas?.length || 0}) ===
      ${propostas?.slice(0, 10).map(p => `- ${p.cliente || 'Cliente N/A'}: ${p.titulo || p.descricao || 'N/A'}, Valor R$ ${parseFloat(p.valor || 0).toFixed(2)}, Status: ${p.status || 'N/A'}`).join('\n      ') || 'Nenhuma proposta'}
      
      === TRANSAÇÕES RECENTES (últimas 20) ===
      ${transacoes?.slice(0, 20).map(t => `- ${t.origem || t.descricao || 'N/A'}: R$ ${parseFloat(t.valor || 0).toFixed(2)} (${t.tipo}) em ${t.data || 'N/A'}`).join('\n      ') || 'Nenhuma transação'}
      
      === FUNCIONÁRIOS (${funcionarios?.length || 0}) ===
      ${funcionarios?.slice(0, 10).map(f => `- ${f.nome}: ${f.funcao || 'N/A'}, Salário R$ ${parseFloat(f.salario || 0).toFixed(2)}, Status: ${f.ativo ? 'Ativo' : 'Inativo'}`).join('\n      ') || 'Nenhum funcionário'}
      
      === COMPROMISSOS (${compromissos?.length || 0}) ===
      ${compromissos?.slice(0, 10).map(c => `- ${c.titulo}: ${c.data || 'N/A'}, ${c.descricao || ''}`).join('\n      ') || 'Nenhum compromisso'}
      
      === DÍVIDAS (${dividas?.length || 0}) ===
      ${dividas?.slice(0, 10).map(d => `- ${d.descricao || d.credor || 'N/A'}: R$ ${parseFloat(d.valor_restante || d.valor || 0).toFixed(2)}`).join('\n      ') || 'Nenhuma dívida'}
      
      === DIÁRIAS (${diarias?.length || 0}) ===
      ${diarias?.slice(0, 10).map(d => `- ${d.data || 'N/A'}: R$ ${parseFloat(d.valor || 0).toFixed(2)}, Pago: ${d.pago ? 'Sim' : 'Não'}`).join('\n      ') || 'Nenhuma diária'}
    `;


    // Buscar contexto RAG
    const ultimaMensagem = messages[messages.length - 1].content;
    const embedding = await gerarEmbedding(ultimaMensagem);
    const docs = await buscarDocumentosSimilares(embedding, 3);
    const contextoRAG = docs && docs.length > 0
      ? docs.map(d => d.conteudo).join('\n---\n')
      : '';

    // Montar prompt final com SISTEMA DE AÇÕES
    const systemPrompt = `
      Você é a pepIA, assistente inteligente do sistema financeiro e de obras.
      
      DADOS DO SISTEMA:
      ${contextoDinamico}
      
      DOCUMENTOS DE CONHECIMENTO:
      ${contextoRAG}
      
      AÇÕES DISPONÍVEIS - Você pode EXECUTAR estas ações quando o usuário solicitar:
      
      1. **LANÇAR NO CAIXA** (entrada ou saída)
         - Pergunte: tipo (receita/despesa), valor, descrição, data, categoria
         - Responda em formato JSON: {"acao": "lancar_caixa", "dados": {...}}
      
      2. **CRIAR PROPOSTA**
         - Pergunte: título, valor, cliente, descrição
         - Responda: {"acao": "criar_proposta", "dados": {...}}
      
      3. **ADICIONAR GASTO EM OBRA**
         - Pergunte: obra_id, valor, categoria, descrição
         - Responda: {"acao": "adicionar_gasto", "dados": {...}}
      
      4. **REGISTRAR COMPROMISSO**
         - Pergunte: título, data, hora, descrição
         - Responda: {"acao": "criar_compromisso", "dados": {...}}
      
      5. **ADICIONAR FUNCIONÁRIO**
         - Pergunte: nome, função, salário, data_admissão
         - Responda: {"acao": "adicionar_funcionario", "dados": {...}}
      
      IMPORTANTE: 
      - Use os dados reais fornecidos acima
      - Quando usuário pedir uma ação, colete as informações necessárias passo a passo
      - Ao ter todos os dados, responda com JSON da ação
      - Seja conversacional e amigável
    `;

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: ultimaMensagem }
    ];

    // Chamar a API de chat da OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Erro da API OpenAI:', data);
      return res.status(response.status).json({ answer: 'Erro da API OpenAI. Detalhes no console do servidor.' });
    }
    const resposta = data.choices?.[0]?.message?.content || 'Erro na resposta da IA.';
    
    // Verificar se a resposta contém uma ação JSON
    try {
      const acaoMatch = resposta.match(/\{["\s]*acao["\s]*:/);
      if (acaoMatch) {
        const jsonStr = resposta.substring(resposta.indexOf('{'), resposta.lastIndexOf('}') + 1);
        const acao = JSON.parse(jsonStr);
        console.log('🎯 Ação detectada:', acao);
        
        // Executar a ação no banco de dados
        const resultadoAcao = await executarAcao(acao, userId, supabase);
        return res.json({ 
          answer: resultadoAcao.mensagem,
          acao_executada: true,
          detalhes: resultadoAcao
        });
      }
    } catch (err) {
      console.log('Sem ação JSON detectada, resposta normal');
    }
    
    res.json({ answer: resposta });
  } catch (err) {
    console.error('Erro no fluxo RAG:', err);
    res.status(500).json({ answer: 'Erro interno no fluxo RAG.' });
  }
});

// FUNÇÃO PARA EXECUTAR AÇÕES NO BANCO
async function executarAcao(acao, userId, supabase) {
  try {
    switch (acao.acao) {
      case 'lancar_caixa':
        const { error: erroTransacao } = await supabase.from('transacoes').insert({
          usuario_id: userId,
          tipo: acao.dados.tipo,
          valor: acao.dados.valor,
          descricao: acao.dados.descricao,
          data: acao.dados.data || new Date().toISOString().split('T')[0],
          categoria: acao.dados.categoria
        });
        if (erroTransacao) throw erroTransacao;
        return { 
          sucesso: true, 
          mensagem: `✅ Lançamento de ${acao.dados.tipo} no valor de R$ ${acao.dados.valor} registrado com sucesso!` 
        };
      
      case 'criar_proposta':
        const { error: erroProposta } = await supabase.from('propostas').insert({
          usuario_id: userId,
          titulo: acao.dados.titulo,
          valor: acao.dados.valor,
          cliente: acao.dados.cliente,
          descricao: acao.dados.descricao,
          status: 'pendente'
        });
        if (erroProposta) throw erroProposta;
        return { 
          sucesso: true, 
          mensagem: `✅ Proposta "${acao.dados.titulo}" criada com sucesso!` 
        };
      
      case 'adicionar_gasto':
        const { error: erroGasto } = await supabase.from('gastos_obra').insert({
          obra_id: acao.dados.obra_id,
          valor: acao.dados.valor,
          categoria: acao.dados.categoria,
          descricao: acao.dados.descricao
        });
        if (erroGasto) throw erroGasto;
        return { 
          sucesso: true, 
          mensagem: `✅ Gasto de R$ ${acao.dados.valor} adicionado à obra!` 
        };
      
      case 'criar_compromisso':
        const { error: erroCompromisso } = await supabase.from('compromissos').insert({
          usuario_id: userId,
          titulo: acao.dados.titulo,
          data: acao.dados.data,
          hora: acao.dados.hora,
          descricao: acao.dados.descricao
        });
        if (erroCompromisso) throw erroCompromisso;
        return { 
          sucesso: true, 
          mensagem: `✅ Compromisso "${acao.dados.titulo}" agendado para ${acao.dados.data}!` 
        };
      
      case 'adicionar_funcionario':
        const { error: erroFunc } = await supabase.from('funcionarios').insert({
          usuario_id: userId,
          nome: acao.dados.nome,
          funcao: acao.dados.funcao,
          salario: acao.dados.salario,
          data_admissao: acao.dados.data_admissao,
          ativo: true
        });
        if (erroFunc) throw erroFunc;
        return { 
          sucesso: true, 
          mensagem: `✅ Funcionário ${acao.dados.nome} cadastrado com sucesso!` 
        };
      
      default:
        return { sucesso: false, mensagem: 'Ação não reconhecida.' };
    }
  } catch (erro) {
    console.error('Erro ao executar ação:', erro);
    return { 
      sucesso: false, 
      mensagem: `❌ Erro ao executar ação: ${erro.message}` 
    };
  }
}

// ============================================
// ENDPOINT: GERAR ESCOPO COM IA
// ============================================
app.post('/api/pepia/gerar-escopo', async (req, res) => {
  const { cliente, template, userId } = req.body;
  
  if (!cliente || !template) {
    return res.status(400).json({ error: 'Cliente e template são obrigatórios' });
  }

  try {
    // BUSCAR PROPOSTAS EXISTENTES PARA APRENDER PADRÕES
    const { data: propostasExistentes } = await supabase
      .from('propostas')
      .select('titulo, descricao, escopo, valor, status')
      .order('created_at', { ascending: false })
      .limit(10);

    // Analisar propostas para extrair padrões
    const escoposExemplo = propostasExistentes
      ?.filter(p => p.escopo && p.escopo.length > 100)
      .slice(0, 3)
      .map(p => `
📄 Exemplo de Escopo (${p.titulo || 'Proposta'}):
${p.escopo}
---
`).join('\n') || 'Nenhum exemplo disponível';

    const prompt = `
Você é um assistente especializado em gerar escopos técnicos para propostas comerciais.

INFORMAÇÕES DO TEMPLATE:
- Tipo de Material/Produto: ${template.tipo_material}
- Características: ${template.caracteristicas?.join(', ') || 'N/A'}
- Peculiaridades: ${template.peculiaridades || 'Nenhuma'}
- Escopo Base: ${template.escopo_base}

CLIENTE: ${cliente}

EXEMPLOS DE ESCOPOS ANTERIORES (aprenda o estilo):
${escoposExemplo}

TAREFA:
1. Adapte o escopo base para o cliente ${cliente}
2. Use o MESMO ESTILO E FORMATO dos exemplos acima
3. Inclua todas as características técnicas de forma profissional
4. Adicione as peculiaridades relevantes
5. Use linguagem formal e técnica
6. Organize em parágrafos claros e numerados
7. Inclua informações sobre instalação, garantia e prazo quando aplicável

FORMATO (siga este padrão):
- Inicie com "ESCOPO DO FORNECIMENTO E SERVIÇO"
- Use seções numeradas (1. OBJETO, 2. ESPECIFICAÇÕES TÉCNICAS, etc.)
- Seja detalhado mas conciso
- Finalize com condições comerciais básicas

Gere o escopo completo agora:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um especialista em elaboração de escopos técnicos e propostas comerciais.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Erro OpenAI:', data);
      return res.status(500).json({ error: 'Erro ao gerar escopo com IA' });
    }

    const escopoGerado = data.choices?.[0]?.message?.content || 'Erro ao gerar escopo';
    
    res.json({ escopo: escopoGerado });
  } catch (err) {
    console.error('Erro ao gerar escopo:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(3001, () => console.log('pepIA proxy rodando na porta 3001'));
