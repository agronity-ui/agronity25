import { createSupabaseServerClient } from '@/lib/supabase/server';
export default async function Page(){
 const supabase=await createSupabaseServerClient();
 const {data}=await supabase.from('app_links').select('*').order('sort_order');
 return <div className="space-y-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Layanan</p><h1 className="page-title mt-2">Link Layanan</h1><p className="mt-3 text-white/60">Shortcut layanan resmi, form, folder, dan resource angkatan.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.map((l:any)=><a key={l.id} href={l.url} target="_blank" className="neo-card block hover:border-neoLime/50"><p className="text-xl font-black">{l.title}</p><p className="mt-2 text-sm text-white/60">{l.description}</p></a>)}</div></div>
}
