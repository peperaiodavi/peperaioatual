import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'success' | 'danger';
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  icon,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Previne scroll do body quando dialog está aberto
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'info':
        return <Info className="dialog-icon-svg" />;
      case 'success':
        return <CheckCircle className="dialog-icon-svg" />;
      case 'danger':
        return <XCircle className="dialog-icon-svg" />;
      case 'warning':
      default:
        return <AlertTriangle className="dialog-icon-svg" />;
    }
  };

  const dialogContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="ios-dialog-portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop com blur */}
          <motion.div
            className="ios-dialog-backdrop"
            onClick={onCancel}
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(12px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
          />

          {/* Dialog Container - Posicionado no centro da viewport visível */}
          <div className="ios-dialog-container">
            <motion.div
              className={`ios-dialog-content ios-dialog-${type}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
            >
              {/* Ícone */}
              <div className={`ios-dialog-icon ios-dialog-icon-${type}`}>
                {getIcon()}
              </div>

              {/* Título */}
              <h3 className="ios-dialog-title">{title}</h3>

              {/* Mensagem */}
              <p className="ios-dialog-message">{message}</p>

              {/* Botões estilo iOS */}
              <div className="ios-dialog-actions">
                <button
                  className="ios-dialog-btn ios-dialog-btn-cancel"
                  onClick={onCancel}
                >
                  {cancelText}
                </button>
                <button
                  className={`ios-dialog-btn ios-dialog-btn-confirm ios-dialog-btn-${type}`}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(dialogContent, document.body);
};
