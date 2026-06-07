import Link from 'next/link';
import Image from 'next/image';
import { APP_ICON } from '@/lib/app';
import { Home, CalendarDays, Newspaper, Trophy, Image as ImageIcon, GraduationCap, Bot, BookOpen, Wallet, Flame, PawPrint, ShieldCheck, Users, Link2, MessageCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';

const nav = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/jadwal', label: 'Jadwal', icon: CalendarDays },
  { href: '/agronews', label: 'AgroNEWS', icon: Newspaper },
  { href: '/apresiasi', label: 'Apresiasi', icon: Trophy },
  { href: '/social', label: 'Social', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/khs', label: 'KHS/IPK', icon: GraduationCap },
  { href: '/ai', label: 'AgronityAI', icon: Bot },
  { href: '/journal', label: 'Jurnal', icon: BookOpen },
  { href: '/finance', label: 'Keuangan', icon: Wallet },
  { href: '/streak', label: 'Streak', icon: Flame },
  { href: '/pet', label: 'Pet', icon: PawPrint },
  { href: '/dokumentasi', label: 'Dokumentasi', icon: ImageIcon },
  { href: '/links', label: 'Layanan', icon: Link2 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single() : { data: null } as any;
  return (
    <div className="min-h-screen pb-28 md:pb-8">
      <header className="fixed left-1/2 top-3 z-40 w-[calc(100%-24px)] max-w-7xl -translate-x-1/2 rounded-[28px] border border-white/10 bg-[#090b0e]/80 shadow-neo backdrop-blur-2xl">
        <div className="flex h-[68px] items-center gap-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <Image src={APP_ICON} alt="Agronity25" width={42} height={42} className="rounded-2xl bg-white/5 p-1" />
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-[-.03em]">Agronity25</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[.18em] text-white/45">TIP ULM 2025</p>
            </div>
          </Link>
          <nav className="hidden flex-1 items-center gap-2 overflow-x-auto md:flex">
            {nav.slice(0, 12).map(item => <NavLink key={item.href} {...item} />)}
          </nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <Link href="/profile" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10">{profile?.full_name || user?.email || 'Masuk'}</Link>
            {user ? <LogoutButton /> : <Link href="/login" className="neo-btn py-2">Login</Link>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 pt-24 md:px-6 md:pt-28">{children}</main>
      <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-20px)] max-w-[560px] -translate-x-1/2 rounded-[26px] border border-white/10 bg-[#090b0e]/90 p-2 shadow-neo backdrop-blur-2xl md:hidden">
        <div className="flex snap-x gap-2 overflow-x-auto pb-1">
          {nav.map(item => <MobileNav key={item.href} {...item} />)}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon: Icon }: any) {
  return <Link href={href} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-transparent bg-white/[.03] px-3 py-2 text-xs font-extrabold text-white/70 hover:border-neoLime/50 hover:bg-neoLime hover:text-black"><Icon size={16}/>{label}</Link>;
}
function MobileNav({ href, label, icon: Icon }: any) {
  return <Link href={href} className="flex h-[62px] min-w-[84px] snap-center flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[.045] px-2 text-[9px] font-black text-white/70"><Icon size={18}/><span className="mt-1 whitespace-nowrap">{label}</span></Link>;
}
