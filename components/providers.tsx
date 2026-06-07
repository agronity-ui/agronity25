'use client';
import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase.rpc('record_activity', { p_activity_type: 'login_daily', p_metadata: { source: 'web' } }).then(({ error }) => {
          if (error) console.warn('activity not recorded', error.message);
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.rpc('record_activity', { p_activity_type: 'login_daily', p_metadata: { source: 'auth-change' } });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  return <>{children}</>;
}

export function MissingSetup({ feature, env }: { feature: string; env: string }) {
  return (
    <div className="neo-card border-yellow-400/40">
      <h3 className="font-black text-yellow-300">Setup diperlukan: {feature}</h3>
      <p className="mt-2 text-sm text-white/70">Isi <code className="rounded bg-black/40 px-2 py-1">{env}</code> di environment Vercel/local, lalu restart aplikasi. Fitur ini tidak mengirim respons palsu.</p>
    </div>
  );
}
