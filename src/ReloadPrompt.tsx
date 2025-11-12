import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './components/ui/button'; // Reutilize seu botão
import { toast } from 'sonner'; // Reutilize seu toast

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registrado.');
    },
    onRegisterError(error) {
      console.error('Erro no registro do Service Worker:', error);
    },
  });

  // Função para fechar o "toast"
  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Efeito que dispara o "toast" quando uma atualização é encontrada
  React.useEffect(() => {
    if (needRefresh) {
      // Usando o 'sonner' toast que você já tem
      toast.info('Uma nova versão está disponível!', {
        position: 'bottom-center',
        duration: 10000, // Fica aberto por 10s ou até ser clicado
        action: {
          label: 'Recarregar',
          onClick: () => {
            updateServiceWorker(true); // Isso recarrega a página
          },
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  // (Opcional) Mostra um toast quando o app está pronto para offline
  React.useEffect(() => {
    if (offlineReady) {
      toast.success('App pronto para funcionar offline.');
    }
  }, [offlineReady]);

  return null; // O componente não renderiza nada visível, só controla o toast.
}

export default ReloadPrompt;
