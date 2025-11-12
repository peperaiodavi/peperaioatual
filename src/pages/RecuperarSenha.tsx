import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    } else {
      toast.success('E-mail de recuperação enviado!');
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-4 max-w-sm mx-auto mt-10">
      <h2 className="text-lg font-bold">Recuperar Senha</h2>
      <Input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>
    </form>
  );
}
