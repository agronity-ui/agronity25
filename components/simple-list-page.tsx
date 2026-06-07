import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function SimpleListPage({ table, title, subtitle, fields }: { table: string; title: string; subtitle: string; fields: string[] }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(80);
  return <div className="space-y-5">
    <div><p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Agronity25</p><h1 className="page-title mt-2">{title}</h1><p className="mt-3 text-white/60">{subtitle}</p></div>
    {error && <div className="neo-card border-red-400/40 text-red-200">{error.message}</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data?.map((row:any) => <article key={row.id} className="neo-card overflow-hidden">
        {(row.poster || row.image_url || row.image || row.thumbnail_url) && <img src={row.poster || row.image_url || row.image || row.thumbnail_url} alt="" className="mb-4 h-48 w-full rounded-3xl object-cover" />}
        {fields.map(f => <p key={f} className={f.includes('judul') || f.includes('name') || f.includes('title') ? 'text-xl font-black tracking-[-.03em]' : 'mt-2 text-sm text-white/60'}>{String(row[f] ?? '')}</p>)}
      </article>)}
    </div>
  </div>;
}
