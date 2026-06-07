import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CalendarDays, Flame, PawPrint, Newspaper, Trophy, GraduationCap } from 'lucide-react';
import { APP_LOGO } from '@/lib/app';
import Image from 'next/image';

export async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: jadwal }, { data: news }, { data: streak }, { data: pet }, { data: grades }] = await Promise.all([
    supabase.from('jadwal_perkuliahan').select('*').order('semester').limit(8),
    supabase.from('berita').select('*').order('created_at', { ascending: false }).limit(3),
    user ? supabase.from('user_streaks').select('*').eq('user_id', user.id).eq('streak_type', 'daily_login').maybeSingle() : Promise.resolve({ data: null } as any),
    user ? supabase.from('pets').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    user ? supabase.from('khs_courses').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] } as any)
  ]);
  return <div className="space-y-6">
    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="neo-card relative overflow-hidden min-h-[330px]">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3"><Image src={APP_LOGO} width={48} height={48} alt="Logo"/><div><p className="text-xs font-black uppercase tracking-[.2em] text-white/40">Good Morning</p><p className="font-black">TIP ULM 2025</p></div></div>
          <Link href="/notifications" className="neo-btn-muted">Notifikasi</Link>
        </div>
        <h1 className="relative z-10 mt-8 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.075em] md:text-7xl">Welcome Back,<span className="block text-neoLime">Agronity25</span></h1>
        <p className="relative z-10 mt-5 max-w-2xl text-sm leading-7 text-white/60">Portal angkatan yang sudah terhubung Supabase: jadwal, AgroNEWS, apresiasi, social, KHS/IPK, AI, jurnal, keuangan, streak, dan pet.</p>
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {quick.map(q => <Link key={q.href} href={q.href} className="rounded-3xl border border-white/10 bg-white/[.04] p-4 font-black hover:border-neoLime/50"><q.icon className="mb-4 text-neoLime"/> {q.label}</Link>)}
        </div>
      </div>
      <div className="grid gap-3">
        <Stat icon={Flame} label="Daily Streak" value={`${streak?.current_count || 0} hari`} />
        <Stat icon={PawPrint} label="Pet Level" value={`${pet?.level || 1} • ${pet?.name || 'AgroPet'}`} />
        <Stat icon={GraduationCap} label="Data KHS" value={`${grades?.length || 0} nilai`} />
      </div>
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="neo-card"><h2 className="text-xl font-black">Jadwal Terdekat</h2><div className="mt-4 space-y-3">{jadwal?.map((j:any)=><div key={j.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-neoLime">Semester {j.semester} • {j.hari}</p><p className="font-bold">{j.nama_matkul}</p><p className="text-sm text-white/50">{j.waktu} • {j.ruangan}</p></div>)}</div></div>
      <div className="neo-card"><h2 className="text-xl font-black">AgroNEWS</h2><div className="mt-4 space-y-3">{news?.map((n:any)=><Link key={n.id} href={`/agronews/${n.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-red-300">{n.tipe || 'Info'}</p><p className="font-bold">{n.judul}</p></Link>)}</div></div>
    </section>
  </div>;
}
const quick = [
  { href:'/jadwal', label:'Jadwal', icon:CalendarDays }, { href:'/agronews', label:'AgroNEWS', icon:Newspaper }, { href:'/apresiasi', label:'Apresiasi', icon:Trophy }, { href:'/streak', label:'Streak', icon:Flame }
];
function Stat({ icon: Icon, label, value }: any) { return <div className="neo-card"><Icon className="text-neoLime"/><p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-xs font-bold text-white/50">{label}</p></div>; }
