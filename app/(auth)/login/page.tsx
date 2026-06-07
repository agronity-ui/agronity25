import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
    <div className="neo-card">
      <p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Agronity25 Auth</p>
      <h1 className="mt-2 page-title text-4xl">Login Mahasiswa</h1>
      <p className="mt-3 text-sm text-white/60">Masuk dengan email/password Supabase Auth. Tidak ada password manual di database.</p>
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm text-white/60">Belum punya akun? <Link href="/register" className="font-bold text-neoLime">Daftar</Link></p>
    </div>
  </main>;
}
