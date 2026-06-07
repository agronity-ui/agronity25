'use client';
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const supabase = createBrowserClient();
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        toast.success('Akun dibuat. Cek email jika confirmation masih aktif di Supabase.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.href = '/dashboard';
      }
    } catch (err: any) { toast.error(err.message || 'Gagal autentikasi'); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="mt-6 space-y-3">
    {mode === 'register' && <input className="neo-input" placeholder="Nama lengkap" value={fullName} onChange={e=>setFullName(e.target.value)} required />}
    <input className="neo-input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
    <input className="neo-input" type="password" placeholder="Password minimal 6 karakter" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
    <button disabled={loading} className="neo-btn w-full" type="submit">{loading ? 'Memproses...' : mode === 'register' ? 'Daftar' : 'Login'}</button>
  </form>;
}
