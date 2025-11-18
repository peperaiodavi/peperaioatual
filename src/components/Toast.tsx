// Toast - Notificações estilo iOS
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  isOpen: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top',
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon-svg" />;
      case 'error':
        return <XCircle className="toast-icon-svg" />;
      case 'warning':
        return <AlertCircle className="toast-icon-svg" />;
      case 'info':
        return <Info className="toast-icon-svg" />;
    }
  };

  const toastContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className={`ios-toast-container ios-toast-${position}`}
          initial={{ opacity: 0, y: position === 'top' ? -100 : 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -100 : 100, scale: 0.9 }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 400,
          }}
        >
          <div className={`ios-toast ios-toast-${type}`}>
            {/* Ícone */}
            <div className={`ios-toast-icon-wrapper ios-toast-icon-${type}`}>
              {getIcon()}
            </div>

            {/* Conteúdo */}
            <div className="ios-toast-content">
              <h4 className="ios-toast-title">{title}</h4>
              {message && <p className="ios-toast-message">{message}</p>}
            </div>

            {/* Botão fechar */}
            <button
              className="ios-toast-close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* Barra de progresso */}
            {duration > 0 && (
              <motion.div
                className="ios-toast-progress"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(toastContent, document.body);
};
