const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos nas variáveis de ambiente.');
}
if (!OPENAI_KEY) {
  throw new Error('OPENAI_KEY deve estar definida nas variáveis de ambiente.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Gera embedding para um texto usando a API do OpenAI
 * @param {string} texto
 * @returns {Promise<number[]>}
 */
async function gerarEmbedding(texto) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENAI_KEY
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texto
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Erro ao gerar embedding');
  return data.data[0].embedding;
}

/**
 * Busca documentos similares no Supabase usando a função match_documentos_vetoriais
 * @param {number[]} queryEmbedding
 * @param {number} limite
 * @returns {Promise<Array<{id: string, conteudo: string, similaridade: number}>>}
 */
async function buscarDocumentosSimilares(queryEmbedding, limite = 3) {
  // Enviar os parâmetros exatamente como a função SQL espera: (query_embedding, match_limit)
  const { data, error } = await supabase.rpc('match_documentos_vetoriais', {
    query_embedding: queryEmbedding,
    match_limit: limite
  });
  if (error) {
    throw new Error(`Erro ao buscar documentos similares: ${error.message}`);
  }
  return data;
}

module.exports = {
  gerarEmbedding,
  buscarDocumentosSimilares
};
