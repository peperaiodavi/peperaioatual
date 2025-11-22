-- LIMPAR DUPLICATAS EM TRANSACOES_ARQUIVADAS
-- Este script remove transações duplicadas (causadas por duplo clique em arquivar)

-- 1. Ver todas as transações de Novembro 2025 (verificar duplicatas)
SELECT 
    id,
    mes_referencia,
    tipo,
    valor,
    origem,
    data,
    categoria,
    created_at
FROM transacoes_arquivadas
WHERE mes_referencia = '2025-11'
ORDER BY valor, tipo, origem, created_at;

-- 2. Contar total (se tiver duplicatas, estará em dobro)
SELECT 
    'Total de transacoes em Novembro' as info,
    COUNT(*) as quantidade
FROM transacoes_arquivadas
WHERE mes_referencia = '2025-11';

-- 3. OPÇÃO MAIS SIMPLES E SEGURA: Deletar tudo de Novembro e re-arquivar
-- Depois você clica em "Arquivar Mês" > Novembro na interface
-- (Agora o sistema NÃO vai duplicar mais)
DELETE FROM transacoes_arquivadas WHERE mes_referencia = '2025-11';

-- 4. Verificar que foi deletado (deve retornar 0)
SELECT 
    'Transacoes restantes em Novembro' as info,
    COUNT(*) as quantidade
FROM transacoes_arquivadas
WHERE mes_referencia = '2025-11';

-- 5. Ver resumo de todos os meses após limpeza
SELECT 
    mes_referencia,
    COUNT(*) as total_transacoes,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas
FROM transacoes_arquivadas
GROUP BY mes_referencia
ORDER BY mes_referencia DESC;
