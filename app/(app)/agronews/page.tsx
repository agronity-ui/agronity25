import { SimpleListPage } from '@/components/simple-list-page';
export default function Page(){ return <SimpleListPage table="berita" title="AgroNEWS" subtitle="Berita, pengumuman, ticker, dan info angkatan tersimpan di Supabase." fields={['tipe','judul','ringkasan','waktu']} />; }
