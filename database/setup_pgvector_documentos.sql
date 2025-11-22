-- 1. Habilitar a extensão pgvector
create extension if not exists vector;

-- 2. Criar a tabela para armazenar os documentos e embeddings
create table if not exists documentos_vetoriais (
    id uuid primary key default gen_random_uuid(),
    conteudo text not null,
    embedding vector(1536) not null
);

-- 3. Criar a função SQL para a busca vetorial (RAG)
CREATE OR REPLACE FUNCTION match_documentos_vetoriais(
    query_embedding vector(1536),
    match_limit int DEFAULT 3
)
RETURNS TABLE (
    id uuid,
    conteudo text,
    similaridade float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        documentos_vetoriais.id,
        documentos_vetoriais.conteudo,
        (documentos_vetoriais.embedding <=> query_embedding) AS similaridade
    FROM documentos_vetoriais
    ORDER BY similaridade
    LIMIT match_limit;
$$;
