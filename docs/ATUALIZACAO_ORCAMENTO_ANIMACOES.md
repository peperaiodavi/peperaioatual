# Atualização: Orçamento e Bibliotecas de Animação

**Data:** 12 de novembro de 2025

## 📦 Bibliotecas Instaladas

### 1. Swiper (Smart Slide)
- **Versão:** 12.0.3
- **Uso:** Carrosséis e slides responsivos
- **Importação:** `import { Swiper, SwiperSlide } from 'swiper/react'`
- **CSS:** `import 'swiper/css'`

### 2. React Spring
- **Versão:** @react-spring/web 10.0.3
- **Uso:** Animações fluidas e transições
- **Importação:** `import { useSpring, animated } from '@react-spring/web'`

## 🔧 Correção da Lógica Financeira em Obras

### Problema Anterior
O sistema subtraía o **valor recebido** do **orçamento**, causando confusão na visualização dos dados financeiros.

### Nova Lógica Implementada

#### Cálculos Atualizados
```typescript
const valorRecebido = obra.valor_recebido || 0;
const totalGastos = obra.gastos.reduce((acc, g) => acc + g.valor, 0);

// Novos cálculos
const lucroReal = valorRecebido - totalGastos;
const lucroProjetado = obra.orcamento - totalGastos;
const aReceberDoCliente = obra.orcamento - valorRecebido;
```

#### Indicadores Financeiros

| Indicador | Fórmula | Descrição |
|-----------|---------|-----------|
| **Orçamento Total** | Valor inicial | Mantém o valor original sem alterações |
| **Lucro Real** | Valor Recebido - Gastos | Lucro efetivo baseado no que já foi recebido |
| **A Receber do Cliente** | Orçamento - Valor Recebido | Quanto ainda falta o cliente pagar |
| **Lucro Projetado** | Orçamento - Gastos | Lucro esperado se receber todo o orçamento |

### Locais Modificados

#### 1. Cards de Obras (`renderObraCard`)
**Antes:**
```typescript
const saldoOrcamentoRestante = obra.orcamento - valorRecebido;
```

**Depois:**
```typescript
const lucroReal = valorRecebido - totalGastos;
const aReceberDoCliente = obra.orcamento - valorRecebido;
const lucroProjetado = obra.orcamento - totalGastos;
```

**Visualização Atualizada:**
- ✅ **Orçamento Total**: Valor original
- ✅ **Total Gastos**: Soma dos gastos
- ✅ **Valor Recebido**: Soma dos pagamentos
- ✅ **Lucro Real**: Recebido - Gastos (verde/vermelho)
- ✅ **A Receber do Cliente**: Orçamento - Recebido (obras ativas)
- ✅ **Lucro Projetado**: Orçamento - Gastos (obras ativas)

#### 2. Diálogo de Pagamento
**Informações Exibidas:**
- Orçamento (valor original)
- Já Recebido
- Total Gastos
- **A Receber do Cliente** (em vez de "Restante a Receber")
- **Lucro Real Atual** (novo campo)

**Toast de Confirmação:**
```typescript
toast.success(`Pagamento registrado! A receber: ${aReceber} | Lucro Real: ${lucroReal}`);
```

#### 3. Diálogo de Finalização
**Novos Campos:**
- **A Receber do Cliente** (substituiu "Restante do Orçamento")
- **Lucro Real Atual** (adicionado ao resumo)

**Cálculo do Lucro Projetado:**
```typescript
lucroFinal = (valorRecebido + valorRestante) - totalGastos
```

#### 4. Exportação de PDF
**Card 3 Atualizado:**
- **Título:** "LUCRO REAL" (substituiu "SALDO RESTANTE")
- **Cálculo:** `valorRecebido - totalGastos`
- **Descrição:** "Recebido - Gastos"

### Benefícios da Nova Abordagem

1. **Clareza Financeira**
   - Orçamento permanece inalterado como referência
   - Lucro real mostra situação atual objetiva
   - Separação clara entre dinheiro recebido e a receber

2. **Transparência**
   - Visualização imediata do lucro efetivo
   - Facilita análise de fluxo de caixa
   - Comparação entre lucro real vs projetado

3. **Gestão Melhorada**
   - Facilita cobrança de clientes (quanto falta receber)
   - Visão realista dos lucros (baseado no recebido)
   - Melhor planejamento financeiro

## 🎨 Exemplos de Uso das Novas Bibliotecas

### Swiper - Exemplo Básico
```tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

function MyCarousel() {
  return (
    <Swiper
      spaceBetween={20}
      slidesPerView={3}
      loop={true}
    >
      <SwiperSlide>Slide 1</SwiperSlide>
      <SwiperSlide>Slide 2</SwiperSlide>
      <SwiperSlide>Slide 3</SwiperSlide>
    </Swiper>
  );
}
```

### React Spring - Exemplo Básico
```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedCard() {
  const springs = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  });

  return (
    <animated.div style={springs}>
      Conteúdo animado
    </animated.div>
  );
}
```

## ✅ Checklist de Verificação

- [x] Bibliotecas Swiper e React Spring instaladas
- [x] Lógica de cálculo do orçamento corrigida
- [x] Cards de obras exibindo lucro real
- [x] Diálogo de pagamento atualizado
- [x] Diálogo de finalização atualizado
- [x] Exportação PDF ajustada
- [x] Toast de confirmação melhorado
- [x] Sem erros de TypeScript

## 🚀 Próximos Passos Sugeridos

1. **Implementar animações com React Spring:**
   - Transições suaves nos cards
   - Fade in/out nos diálogos
   - Animações de contadores (lucro, gastos)

2. **Usar Swiper para:**
   - Galeria de fotos das obras
   - Carrossel de cards de obras
   - Navegação mobile otimizada

3. **Melhorias de UX:**
   - Gráficos animados de progresso
   - Indicadores visuais de lucro/prejuízo
   - Transições entre estados de obras

## 📊 Impacto da Mudança

### Antes
```
Orçamento: R$ 50.000
Recebido: R$ 30.000
Gastos: R$ 20.000
Saldo: R$ 20.000 - R$ 30.000 = R$ 10.000 ❌ (confuso)
```

### Depois
```
Orçamento: R$ 50.000 (valor original mantido)
Recebido: R$ 30.000
Gastos: R$ 20.000
Lucro Real: R$ 30.000 - R$ 20.000 = R$ 10.000 ✅
A Receber: R$ 50.000 - R$ 30.000 = R$ 20.000 ✅
Lucro Projetado: R$ 50.000 - R$ 20.000 = R$ 30.000 ✅
```
