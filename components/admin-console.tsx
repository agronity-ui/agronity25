'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { uploadToBucket } from '@/lib/upload';
import { STORAGE_BUCKETS } from '@/lib/app';
import { toast } from 'sonner';

type AdminTable = 'jadwal_perkuliahan'|'berita'|'apresiasi'|'dokumentasi'|'social_reports'|'profiles';
const fields: Record<AdminTable,string[]> = {
  jadwal_perkuliahan: ['semester','hari','day_order','waktu','start_time','end_time','nama_matkul','ruangan'],
  berita: ['judul','tipe','waktu','ringkasan','link','poster'],
  apresiasi: ['slug','name','category','badge','quote','image','gradient'],
  dokumentasi: ['title','description','category','image_url'],
  social_reports: ['status','reason','admin_note'],
  profiles: ['full_name','username','role','avatar_url']
};

export function AdminConsole(){
 const supabase=createBrowserClient(); const [role,setRole]=useState('user'); const [table,setTable]=useState<AdminTable>('jadwal_perkuliahan'); const [items,setItems]=useState<any[]>([]); const [form,setForm]=useState<any>({}); const [file,setFile]=useState<File|null>(null); const [loading,setLoading]=useState(false);
 async function check(){ const {data}=await supabase.rpc('my_role'); setRole(data||'user'); }
 async function load(){ const {data,error}=await supabase.from(table).select('*').order('created_at',{ascending:false}).limit(100); if(error) toast.error(error.message); else setItems(data||[]) }
 useEffect(()=>{check()},[]); useEffect(()=>{load(); setForm({})},[table]);
 async function save(e:React.FormEvent){ e.preventDefault(); setLoading(true); try{ let payload={...form}; if(file){ const bucket=table==='berita'||table==='apresiasi'||table==='dokumentasi'?STORAGE_BUCKETS.cms:STORAGE_BUCKETS.avatars; const up=await uploadToBucket(bucket,file,table,['image/','video/'],30); if(table==='berita') payload.poster=up.publicUrl; if(table==='apresiasi') payload.image=up.publicUrl; if(table==='dokumentasi') payload.image_url=up.publicUrl; if(table==='profiles') payload.avatar_url=up.publicUrl; }
   const id=payload.id; delete payload.id; const query=id?supabase.from(table).update(payload).eq('id',id):supabase.from(table).insert(payload); const {error}=await query; if(error) throw error; toast.success(id?'Data diperbarui':'Data dipublish'); setForm({}); setFile(null); load(); }catch(e:any){toast.error(e.message)} finally{setLoading(false)} }
 async function remove(id:string){ if(!confirm('Hapus data ini?')) return; const {error}=await supabase.from(table).delete().eq('id',id); if(error) toast.error(error.message); else load(); }
 if(!['admin','super_admin'].includes(role)) return <div className="neo-card border-red-400/40"><h1 className="text-2xl font-black text-red-200">Akses admin ditolak</h1><p className="mt-2 text-white/60">Set role kamu di table profiles/admin_roles setelah menjalankan SQL.</p></div>;
 return <div className="space-y-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-neoLime">Admin Studio</p><h1 className="page-title mt-2">Dashboard Admin Agronity25</h1><p className="mt-3 text-white/60">CRUD jadwal, AgroNEWS, apresiasi, dokumentasi, user, dan moderasi social. Data baru tidak menghapus data lama.</p></div><div className="flex gap-2 overflow-x-auto">{Object.keys(fields).map(t=><button key={t} onClick={()=>setTable(t as AdminTable)} className={table===t?'neo-btn':'neo-btn-muted'}>{t}</button>)}</div><section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={save} className="neo-card space-y-3"><h2 className="text-xl font-black">{form.id?'Edit':'Tambah'} {table}</h2>{fields[table].map(f=><div key={f}><label className="text-xs font-bold text-white/50">{f}</label><input className="neo-input" value={form[f] ?? ''} onChange={e=>setForm({...form,[f]:e.target.value})}/></div>)}<input className="neo-input" type="file" accept="image/*,video/*" onChange={e=>setFile(e.target.files?.[0]||null)}/><button className="neo-btn w-full" disabled={loading}>{loading?'Menyimpan...':'Simpan / Publish'}</button><button type="button" className="neo-btn-muted w-full" onClick={()=>setForm({})}>Reset Form</button></form><div className="neo-card"><h2 className="text-xl font-black">Preview & Data</h2><div className="mt-3 rounded-3xl border border-neoLime/20 bg-neoLime/10 p-4"><pre className="whitespace-pre-wrap text-xs text-white/70">{JSON.stringify(form,null,2)}</pre></div><div className="mt-4 max-h-[70vh] space-y-3 overflow-auto">{items.map(row=><div key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-4"><p className="font-black">{row.judul||row.name||row.title||row.nama_matkul||row.full_name||row.reason||row.id}</p><p className="text-xs text-white/40">{row.created_at}</p><div className="mt-3 flex gap-2"><button className="neo-btn-muted" onClick={()=>setForm(row)}>Edit</button><button className="neo-btn-muted text-red-200" onClick={()=>remove(row.id)}>Hapus</button></div></div>)}</div></div></section></div>
}
