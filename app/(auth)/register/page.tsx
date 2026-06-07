import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
    <div className="neo-card">
      <p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Agronity25 Auth</p>
      <h1 className="mt-2 page-title text-4xl">Daftar Akun</h1>
      <p className="mt-3 text-sm text-white/60">Profil otomatis dibuat lewat trigger Supabase saat akun terdaftar.</p>
      <AuthForm mode="register" />
      <p className="mt-4 text-center text-sm text-white/60">Sudah punya akun? <Link href="/login" className="font-bold text-neoLime">Login</Link></p>
    </div>
  </main>;
}
