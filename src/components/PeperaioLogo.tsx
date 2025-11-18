// PeperaioLogo - Logo animada da empresa
import { motion } from 'framer-motion';
import './PeperaioLogo.css';

interface PeperaioLogoProps {
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

export default function PeperaioLogo({ size = 'medium', animate = true }: PeperaioLogoProps) {
  return (
    <motion.div
      className={`peperaio-logo peperaio-logo-${size}`}
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.6 }}
    >
      {/* Texto Principal */}
      <motion.div
        className="peperaio-logo-main"
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="peperaio-text">PEPERAIO</span>
      </motion.div>

      {/* Linhas decorativas (estilo bandeira italiana) */}
      <div className="peperaio-logo-stripes">
        <motion.div
          className="peperaio-stripe peperaio-stripe-green"
          initial={animate ? { scaleX: 0 } : false}
          animate={animate ? { scaleX: 1 } : false}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        <motion.div
          className="peperaio-stripe peperaio-stripe-white"
          initial={animate ? { scaleX: 0 } : false}
          animate={animate ? { scaleX: 1 } : false}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
        <motion.div
          className="peperaio-stripe peperaio-stripe-red"
          initial={animate ? { scaleX: 0 } : false}
          animate={animate ? { scaleX: 1 } : false}
          transition={{ duration: 0.6, delay: 0.5 }}
        />
      </div>

      {/* Efeito de brilho animado */}
      {animate && (
        <motion.div
          className="peperaio-logo-shine"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
          }}
        />
      )}
    </motion.div>
  );
}
