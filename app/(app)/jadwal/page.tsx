import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CalendarDays } from 'lucide-react';

export default async function Page(){
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.from('jadwal_perkuliahan').select('*').order('semester').order('day_order').order('start_time');
 const grouped=(data||[]).reduce((acc:any,row:any)=>{ const key=`Semester ${row.semester} • ${row.hari}`; (acc[key] ||= []).push(row); return acc; },{});
 return <div className="space-y-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Countdown siap lewat client widget</p><h1 className="page-title mt-2">Jadwal Kuliah</h1><p className="mt-3 text-white/60">Jadwal default lama disimpan sebagai seed dan jadwal admin baru ditambahkan tanpa menghapus data lama.</p></div>{error&&<div className="neo-card text-red-200">{error.message}</div>}<div className="grid gap-5 lg:grid-cols-2">{Object.entries(grouped).map(([key,rows]:any)=><section key={key} className="neo-card"><div className="mb-4 flex items-center gap-3"><CalendarDays className="text-neoLime"/><h2 className="text-2xl font-black tracking-[-.04em]">{key}</h2></div><div className="space-y-3">{rows.map((r:any)=><div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-neoLime">{r.waktu || `${r.start_time || ''} - ${r.end_time || ''}`}</p><p className="font-bold">{r.nama_matkul}</p><p className="text-sm text-white/50">{r.ruangan}</p></div>)}</div></section>)}</div></div>
}
