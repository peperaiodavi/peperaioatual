# Sistema de Diálogos iOS

Sistema completo de diálogos e notificações no estilo iOS moderno.

## Componentes

### 1. ConfirmDialog
Diálogo de confirmação estilo iOS com backdrop blur.

**Uso:**
```tsx
import { ConfirmDialog } from './components/ConfirmDialog';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <ConfirmDialog
      isOpen={showDialog}
      type="warning" // 'warning' | 'info' | 'success' | 'danger'
      title="Confirmar exclusão?"
      message="Esta ação não pode ser desfeita."
      confirmText="Excluir"
      cancelText="Cancelar"
      onConfirm={() => {
        // Ação de confirmação
        setShowDialog(false);
      }}
      onCancel={() => setShowDialog(false)}
    />
  );
}
```

**Tipos disponíveis:**
- `warning` - Amarelo (padrão)
- `danger` - Vermelho
- `info` - Azul
- `success` - Verde

### 2. Toast
Notificações temporárias no topo ou rodapé da tela.

**Uso:**
```tsx
import { Toast } from './components/Toast';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <Toast
      isOpen={showToast}
      type="success" // 'success' | 'error' | 'warning' | 'info'
      title="Sucesso!"
      message="Operação realizada com sucesso"
      duration={4000} // ms - 0 para não fechar automaticamente
      position="top" // 'top' | 'bottom'
      onClose={() => setShowToast(false)}
    />
  );
}
```

## Características

### ✨ Design iOS 17
- Glassmorphism com ultra blur
- Animações suaves com spring physics
- Cores e tipografia do iOS
- Safe areas para notch e home indicator

### 📱 Mobile-First
- Posicionamento sempre visível na viewport
- Adaptativo para diferentes tamanhos
- Suporte a orientação landscape
- Touch-friendly com feedback visual

### ♿ Acessibilidade
- Previne scroll do body quando aberto
- Fechamento com backdrop
- Animações respeitam prefers-reduced-motion
- Cores com contraste adequado

### 🎨 Variantes de Cor
Cada tipo tem sua paleta:
- **Success**: Verde (#22c55e)
- **Error/Danger**: Vermelho (#ef4444)
- **Warning**: Amarelo (#fbbf24)
- **Info**: Azul (#60a5fa)

## Exemplos Avançados

### Dialog com ícone customizado
```tsx
<ConfirmDialog
  isOpen={true}
  title="Atenção"
  message="Tem certeza?"
  icon={<CustomIcon />}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### Toast com duração infinita
```tsx
<Toast
  isOpen={true}
  type="info"
  title="Processando..."
  message="Aguarde enquanto salvamos suas alterações"
  duration={0} // Não fecha automaticamente
  onClose={handleClose}
/>
```

## Integração com Context

Para uso global, crie um Context:

```tsx
// DialogContext.tsx
import { createContext, useContext, useState } from 'react';

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  showToast: (options: ToastOptions) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState<DialogOptions | null>(null);
  const [toastState, setToastState] = useState<ToastOptions | null>(null);

  const showDialog = (options: DialogOptions) => {
    setDialogState(options);
  };

  const showToast = (options: ToastOptions) => {
    setToastState(options);
  };

  return (
    <DialogContext.Provider value={{ showDialog, showToast }}>
      {children}
      
      {dialogState && (
        <ConfirmDialog
          {...dialogState}
          isOpen={!!dialogState}
          onCancel={() => setDialogState(null)}
        />
      )}
      
      {toastState && (
        <Toast
          {...toastState}
          isOpen={!!toastState}
          onClose={() => setToastState(null)}
        />
      )}
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};
```

**Uso:**
```tsx
function MyComponent() {
  const { showDialog, showToast } = useDialog();

  const handleDelete = () => {
    showDialog({
      type: 'danger',
      title: 'Excluir item?',
      message: 'Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        await deleteItem();
        showToast({
          type: 'success',
          title: 'Item excluído',
          message: 'O item foi removido com sucesso'
        });
      }
    });
  };

  return <button onClick={handleDelete}>Excluir</button>;
}
```
