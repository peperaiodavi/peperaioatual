require('dotenv').config();
const { gerarEmbedding } = require('./pepia-rag-service');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Exemplos de documentos para popular o RAG
const documentos = [
  {
    conteudo: 'Para consultar o saldo da sua conta no sistema, acesse o menu Caixa e veja o valor exibido no topo da tela. O saldo é atualizado automaticamente após cada movimentação.'
  },
  {
    conteudo: 'O sistema permite visualizar o extrato detalhado de todas as movimentações financeiras na aba Financeiro. Lá você encontra o saldo atual, receitas e despesas.'
  },
  {
    conteudo: 'Se você tiver dúvidas sobre o saldo ou movimentações, entre em contato com o suporte pelo chat ou pelo e-mail financeiro@empresa.com.'
  }
];

async function inserirDocumentos() {
  for (const doc of documentos) {
    try {
      const embedding = await gerarEmbedding(doc.conteudo);
      const { error } = await supabase
        .from('documentos_vetoriais')
        .insert([{ conteudo: doc.conteudo, embedding }]);
      if (error) {
        console.error('Erro ao inserir:', error);
      } else {
        console.log('Documento inserido com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao processar documento:', err);
    }
  }
}

inserirDocumentos();
