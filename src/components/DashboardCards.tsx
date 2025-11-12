import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wallet, TrendingUp, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface DashboardCardsProps {
  saldoCaixa: number;
  totalReceber: number;
  dividasAtivas: number;
  lucroTotal: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export function DashboardCards({ saldoCaixa, totalReceber, dividasAtivas, lucroTotal }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Saldo do Caixa',
      value: saldoCaixa,
      icon: Wallet,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      glowColor: 'shadow-blue-500/20',
      valueColor: saldoCaixa >= 0 ? 'text-black' : 'text-red-500',
    },
    {
      title: 'Total a Receber',
      value: totalReceber,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-emerald-500/20',
      valueColor: 'text-yellow-500',
    },
    {
      title: 'Dívidas Ativas',
      value: dividasAtivas,
      icon: CreditCard,
      gradient: 'from-red-500 to-rose-500',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      glowColor: 'shadow-red-500/20',
      valueColor: 'text-red-600',
    },
    {
      title: 'Lucro Total',
      value: lucroTotal,
      icon: DollarSign,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      glowColor: 'shadow-purple-500/20',
      valueColor: lucroTotal >= 0 ? 'text-black' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        // Determinar se é o card de Saldo do Caixa e se o valor é negativo
        const isSaldoCaixaNegativo = card.title === 'Saldo do Caixa' && card.value < 0;
        const cardGradient = isSaldoCaixaNegativo ? 'from-red-900 to-red-700' : 'from-[#1a1f37] to-[#141b2d]';
        const cardBorder = isSaldoCaixaNegativo ? 'border-red-500' : 'border-[#1e293b]';
        const valorColor = isSaldoCaixaNegativo ? 'text-red-600' : card.valueColor;
        
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.5
            }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { duration: 0.2 }
            }}
          >
            <Card className={`
              bg-gradient-to-br ${cardGradient}
              ${cardBorder}
              hover:border-opacity-80
              shadow-xl hover:shadow-2xl
              ${card.glowColor}
              transition-all duration-300
              overflow-hidden
              relative
            `}>
              {/* Gradient Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5`} />
              
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {card.title}
                </CardTitle>
                <motion.div 
                  className={`p-2 rounded-lg ${card.iconBg}`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </motion.div>
              </CardHeader>
              <CardContent className="relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className={`text-2xl font-bold ${valorColor}`}
                >
                  {formatCurrency(card.value)}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
