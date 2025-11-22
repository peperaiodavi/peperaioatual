import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PepIA() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona automaticamente para a nova seção completa
    navigate('/pepIA-section', { replace: true });
  }, [navigate]);

  return null;
}
