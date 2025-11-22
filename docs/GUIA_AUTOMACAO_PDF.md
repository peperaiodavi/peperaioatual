# 🤖 Guia de Uso: Automação PDF com IA

## 📋 Visão Geral

A **Automação PDF** é uma ferramenta inteligente que permite gerar escopos técnicos personalizados para propostas comerciais automaticamente. A IA aprende sobre os materiais e características dos seus produtos para criar documentos profissionais rapidamente.

---

## 🚀 Como Funciona

### 1️⃣ **Criar Templates de Escopo**

Um template é um modelo que contém informações sobre um produto/serviço:

#### **Passo a Passo:**
1. Clique em **"Criar Novo Template"**
2. Preencha os campos:
   - **Nome**: Identificador do template (ex: "Portão Alumínio Premium")
   - **Tipo de Material**: Categoria do produto (ex: "Portão de Alumínio")
   - **Características**: Adicione especificações técnicas:
     - Dimensões padrão
     - Material utilizado
     - Acabamento
     - Cor
     - Sistema de abertura
     - Garantia
   - **Peculiaridades**: Detalhes específicos sobre instalação, manutenção, etc.
   - **Escopo Base**: Texto inicial que será personalizado pela IA

#### **Exemplo de Template:**
```
Nome: Portão Alumínio Automático Premium
Tipo de Material: Portão de Alumínio
Características:
  - Dimensões: 3,00m x 2,50m
  - Material: Alumínio anodizado
  - Acabamento: Fosco
  - Cor: Preto (padrão RAL 9005)
  - Motor: PPA Penta 1/3 HP
  - Controle remoto: 2 unidades
  - Garantia: 12 meses

Peculiaridades:
  - Requer instalação elétrica 220V bifásica
  - Prazo de instalação: 3 dias úteis
  - Manutenção preventiva recomendada a cada 6 meses
  - Incluso: trena de abertura, fotocélulas e kit pintura retoque

Escopo Base:
O presente escopo técnico refere-se ao fornecimento e instalação de portão automático em alumínio de alta qualidade, destinado a garantir segurança, durabilidade e sofisticação ao imóvel do cliente.
```

3. Clique em **"Salvar Template"**

---

### 2️⃣ **Gerar Escopo com IA**

Com os templates cadastrados, você pode gerar escopos personalizados:

#### **Passo a Passo:**
1. Clique em **"Gerar Escopo com IA"**
2. Digite o **nome do cliente**
3. Selecione o **template** desejado
4. Clique em **"Gerar"**
5. A IA criará um escopo personalizado em segundos!

#### **O que a IA faz:**
- Adapta o escopo base para o cliente específico
- Inclui todas as características técnicas de forma profissional
- Adiciona as peculiaridades relevantes
- Organiza em parágrafos claros e formatados
- Usa linguagem técnica e formal
- Inclui informações sobre instalação, garantia e prazo

#### **Resultado Exemplo:**
```
ESCOPO DO FORNECIMENTO E SERVIÇO - Cliente: CONSTRUTORA ABC LTDA

1. OBJETO
O presente documento tem por objeto detalhar o fornecimento e instalação de portão 
automático em alumínio de alta qualidade para o imóvel do cliente CONSTRUTORA ABC LTDA, 
visando garantir segurança, durabilidade e sofisticação.

2. ESPECIFICAÇÕES TÉCNICAS
- Dimensões: 3,00m (largura) x 2,50m (altura)
- Material: Alumínio anodizado de primeira linha
- Acabamento: Fosco antirreflexivo
- Cor: Preto RAL 9005 (padrão internacional)
- Sistema de automação: Motor PPA Penta 1/3 HP com controle por frequência
- Acessórios inclusos: 2 controles remotos de alta frequência

3. INSTALAÇÃO E INFRAESTRUTURA
A instalação será realizada por equipe técnica especializada, com prazo de 3 dias úteis.
Requer alimentação elétrica 220V bifásica. O fornecimento inclui trena de abertura, 
fotocélulas de segurança e kit de pintura para retoque.

4. GARANTIA E MANUTENÇÃO
Garantia de 12 meses para motor e componentes eletrônicos. Recomenda-se manutenção 
preventiva semestral para preservação do equipamento.

5. CONDIÇÕES COMERCIAIS
Forma de pagamento: Conforme negociação
Prazo de entrega: A combinar após aprovação do projeto
Validade da proposta: 30 dias
```

---

### 3️⃣ **Usar o Escopo Gerado**

Após a geração:
1. **Copiar para Área de Transferência**: Clique no botão "Copiar" para colar em outros documentos
2. **Exportar PDF**: Gere um PDF profissional para enviar ao cliente (em breve)
3. **Editar Manualmente**: Cole no Word/Google Docs e faça ajustes finais

---

## 💡 Dicas de Uso

### ✅ **Para Melhores Resultados:**
- Crie templates detalhados e completos
- Use linguagem técnica nas características
- Seja específico nas peculiaridades (prazos, requisitos, condições)
- Mantenha o escopo base profissional e formal
- Revise o escopo gerado antes de enviar ao cliente

### 🎯 **Casos de Uso:**
- **Orçamentos rápidos**: Gere escopos em minutos para atender múltiplos clientes
- **Padronização**: Garanta que todos os escopos sigam o mesmo padrão de qualidade
- **Personalização**: Cada cliente recebe um documento único com seu nome
- **Economia de tempo**: Reduza de horas para minutos a criação de propostas

### 🔄 **Gerenciamento de Templates:**
- **Editar**: Clique no ícone de lápis para atualizar informações
- **Deletar**: Remova templates desatualizados
- **Visualizar**: Veja todos os detalhes de um template antes de usar
- **Copiar características**: Mantenha um template base e crie variações

---

## 📊 Benefícios

| Antes | Depois (com IA) |
|-------|----------------|
| 2-4 horas criando proposta manual | 5 minutos gerando automaticamente |
| Documentos sem padrão | Escopos profissionais e consistentes |
| Risco de esquecer informações | Todas as características sempre inclusas |
| Difícil personalizar para cada cliente | Personalização automática instantânea |

---

## 🛠️ Configuração Inicial

### Pré-requisitos:
1. ✅ Backend rodando na porta 3001 (`pepia-proxy.js`)
2. ✅ Tabela `templates_escopo` criada no Supabase
3. ✅ OpenAI API configurada no backend

### Primeira Execução:
1. Execute o script SQL: `database/create_templates_escopo.sql`
2. Inicie o backend: `node pepia-proxy.js`
3. Acesse a aba **"Automação PDF"** no pepIA
4. Crie seu primeiro template!

---

## 🔧 Troubleshooting

### Problema: "Erro ao gerar escopo"
**Solução**: Verifique se o backend está rodando e se a OpenAI API está configurada.

### Problema: Templates não aparecem
**Solução**: Execute `create_templates_escopo.sql` no Supabase SQL Editor.

### Problema: Escopo gerado muito genérico
**Solução**: Adicione mais detalhes nas características e peculiaridades do template.

### Problema: Erro ao salvar template
**Solução**: Verifique se você está logado e se as políticas RLS do Supabase estão ativas.

---

## 📈 Próximos Passos

- [ ] Exportação PDF direta (sem precisar copiar/colar)
- [ ] Templates com imagens e logotipo
- [ ] Variações automáticas (3 opções de escopo por cliente)
- [ ] Histórico de escopos gerados
- [ ] Integração com módulo de Propostas

---

## 🤝 Suporte

Dúvidas? Entre em contato ou consulte a documentação completa em `docs/`.
