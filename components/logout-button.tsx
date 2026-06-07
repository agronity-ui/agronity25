'use client';
import { createBrowserClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return <button className="neo-btn-muted py-2" onClick={async () => { await createBrowserClient().auth.signOut(); location.href = '/login'; }}><LogOut size={16}/>Keluar</button>;
}
